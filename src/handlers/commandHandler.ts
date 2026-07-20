import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { GuildMember } from "discord.js";
import type { PanindiganClient } from "../structures/Client.js";
import type { AccessTier, CommandDefinition, RunContext } from "../structures/types.js";
import { scopedLogger } from "../utils/logger.js";
import { resolveAccessTier, tierSatisfies, TIER_LABELS } from "../utils/permissions.js";
import { EmbedFactory } from "../structures/EmbedFactory.js";
import { sanitizeArgs } from "../utils/sanitize.js";
import { GuildModel } from "../database/models/Guild.js";
import { BlacklistModel } from "../database/models/Moderation.js";
import { isGuildPremium } from "../utils/premium.js";
import { MaintenanceStateModel } from "../database/models/System.js";
import { isBotOwner } from "../utils/permissions.js";
import { botCache, CACHE_TTL } from "../utils/cache.js";
import { isFeatureEnabled } from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const _require   = createRequire(import.meta.url);

const log = scopedLogger("commands");

// ── Per-guild command hit counter (in-memory) ────────────────────────────────
// Structure: guildId → commandName → hit count
// Exported so the help command can read it for "Frequently Used" section.
export const hitCounter = new Map<string, Map<string, number>>();

function recordHit(guildId: string | null, commandName: string): void {
  const key = guildId ?? "__dm__";
  const bucket = hitCounter.get(key) ?? new Map<string, number>();
  bucket.set(commandName, (bucket.get(commandName) ?? 0) + 1);
  hitCounter.set(key, bucket);
}

/** Returns the top N commands by hit count for a guild. */
export function topCommands(guildId: string | null, n = 5): Array<{ name: string; hits: number }> {
  const bucket = hitCounter.get(guildId ?? "__dm__");
  if (!bucket) return [];
  return [...bucket.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, hits]) => ({ name, hits }));
}

// ── Guild config with cache ──────────────────────────────────────────────────

async function getGuildConfig(guildId: string): Promise<Record<string, unknown> | null> {
  const cacheKey = `guild:${guildId}`;
  const cached   = botCache.get<Record<string, unknown>>(cacheKey);
  if (cached !== undefined) return cached;

  const doc = await GuildModel.findOne({ guildId }).lean() as Record<string, unknown> | null;
  botCache.set(cacheKey, doc ?? null, CACHE_TTL.GUILD_CONFIG);
  return doc;
}

// ── Command dispatcher ───────────────────────────────────────────────────────

export async function dispatchCommand(
  client: PanindiganClient,
  command: CommandDefinition,
  ctx: RunContext,
  member: GuildMember | null,
): Promise<void> {
  const start = Date.now();

  try {
    // ── Sanitize args ──────────────────────────────────────────────────────
    ctx.args = sanitizeArgs(ctx.args);

    // ── Blacklist ──────────────────────────────────────────────────────────
    if (await BlacklistModel.exists({ entityId: ctx.userId, entityType: "user" })) return;
    if (ctx.guildId && await BlacklistModel.exists({ entityId: ctx.guildId, entityType: "server" })) return;

    // ── Maintenance mode ───────────────────────────────────────────────────
    const maintenance = await MaintenanceStateModel.findOne({ key: "singleton" }).lean();
    if (maintenance?.enabled && !isBotOwner(ctx.userId)) {
      await ctx.reply({ embeds: [EmbedFactory.warning(maintenance.message ?? "The bot is under maintenance. Please try again later.")], ephemeral: true });
      return;
    }

    // ── Guild-only gate ────────────────────────────────────────────────────
    if (command.guildOnly !== false && !ctx.guildId) {
      await ctx.reply({ embeds: [EmbedFactory.error("This command can only be used inside a server.")], ephemeral: true });
      return;
    }

    // ── Per-server config checks ───────────────────────────────────────────
    if (ctx.guildId) {
      const guildConfig = await getGuildConfig(ctx.guildId);
      if (Array.isArray(guildConfig?.["disabledCommands"]) && (guildConfig!["disabledCommands"] as string[]).includes(command.name)) {
        await ctx.reply({ embeds: [EmbedFactory.error(`The \`${command.name}\` command is disabled in this server.`)], ephemeral: true });
        return;
      }
      if (Array.isArray(guildConfig?.["ignoredUsers"]) && (guildConfig!["ignoredUsers"] as string[]).includes(ctx.userId)) return;
    }

    // ── Access tier ────────────────────────────────────────────────────────
    const tier = await resolveAccessTier(member, ctx.userId);
    if (!tierSatisfies(tier, command.access)) {
      await ctx.reply({ embeds: [EmbedFactory.error(`You need **${TIER_LABELS[command.access]}** access to use this command.`)], ephemeral: true });
      return;
    }

    // ── Member permissions ─────────────────────────────────────────────────
    if (command.memberPermissions?.length && member && !member.permissions.has(command.memberPermissions)) {
      await ctx.reply({ embeds: [EmbedFactory.error("You don't have the required Discord permissions to use this command.")], ephemeral: true });
      return;
    }

    // ── Bot permissions ────────────────────────────────────────────────────
    if (command.botPermissions?.length && member?.guild.members.me) {
      if (!member.guild.members.me.permissions.has(command.botPermissions)) {
        await ctx.reply({ embeds: [EmbedFactory.error("I'm missing the permissions required to run this command.")], ephemeral: true });
        return;
      }
    }

    // ── Premium gate ───────────────────────────────────────────────────────
    if (command.premium && ctx.guildId) {
      const premium = await isGuildPremium(ctx.guildId);
      if (!premium) {
        await ctx.reply({ embeds: [EmbedFactory.premium(`\`${command.name}\` is a Premium-only command. Type \`/premium\` to see plans and pricing.`)], ephemeral: true });
        return;
      }
    }

    // ── Cooldown ───────────────────────────────────────────────────────────
    const cooldownSeconds = command.cooldown ?? client.config.cooldowns?.defaultCommandSeconds ?? 0;
    const remaining       = client.isOnCooldown(command.name, ctx.userId, cooldownSeconds);
    if (remaining) {
      await ctx.reply({ embeds: [EmbedFactory.warning(`Slow down! Try \`/${command.name}\` again in **${remaining}s**.`)], ephemeral: true });
      return;
    }

    // ── Execute ────────────────────────────────────────────────────────────
    await command.execute(ctx);

    const duration = Date.now() - start;
    recordHit(ctx.guildId, command.name);
    log.info(`Command executed: ${command.name}`, {
      userId:   ctx.userId,
      guildId:  ctx.guildId ?? "DM",
      via:      ctx.isSlash ? "slash" : "prefix",
      durationMs: duration,
    });

    if (duration > 3_000) {
      log.warn(`SLOW command: ${command.name} took ${duration}ms`, { durationMs: duration });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack : undefined;
    log.error(`Command "${command.name}" threw an error`, { error: message, stack, userId: ctx.userId, guildId: ctx.guildId });
    try {
      await ctx.reply({ embeds: [EmbedFactory.error("Something went wrong while running that command. The error has been logged.")], ephemeral: true });
    } catch { /* interaction may already be dead */ }
  }
}

// ── File walker ──────────────────────────────────────────────────────────────

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      files.push(full);
    }
    // Skip non-.ts/.js files silently
  }
  return files;
}

// ── Command loader ───────────────────────────────────────────────────────────

export async function loadCommands(client: PanindiganClient): Promise<number> {
  const commandsDir = path.join(__dirname, "..", "commands");
  if (!fs.existsSync(commandsDir)) {
    log.warn("Commands directory not found", { commandsDir });
    return 0;
  }

  const files  = walk(commandsDir);
  let   loaded = 0;

  for (const file of files) {
    try {
      const mod = _require(file);
      let rawCommand: unknown = (mod as Record<string, unknown>).default ?? (mod as Record<string, unknown>).command;

      // ── Backward-compat shim ─────────────────────────────────────────────
      if (rawCommand && typeof rawCommand === "object" && !("name" in rawCommand) && "data" in rawCommand) {
        const legacy = rawCommand as { data: { name: string; description?: string }; execute(i: unknown): Promise<void>; category?: string; accessTier?: string };
        const tierMap: Record<string, string> = {
          user: "general", general: "general", mod: "moderator",
          moderator: "moderator", admin: "admin", owner: "owner", coowner: "coowner",
        };
        const oldExecute = legacy.execute.bind(legacy);
        const cmdName    = legacy.data.name;
        rawCommand = {
          name:        cmdName,
          description: legacy.data.description ?? "No description",
          category:    legacy.category ?? "General",
          access:      (tierMap[legacy.accessTier ?? "general"] ?? "general") as AccessTier,
          guildOnly:   true,
          async execute(ctx: RunContext) {
            if (ctx.isSlash) await oldExecute(ctx.interaction);
            else await ctx.reply({ content: `This command only supports slash. Use \`/${cmdName}\`.` });
          },
        } satisfies Partial<CommandDefinition> as unknown;
      }

      const command = rawCommand as CommandDefinition | undefined;

      // ── Validation ─────────────────────────────────────────────────────
      if (!command || !command.name || typeof command.execute !== "function") {
        log.warn(`Skipping malformed command file (missing name or execute)`, { file });
        continue;
      }
      if (!command.description) log.warn(`Command "${command.name}" is missing a description`, { file });
      if (!command.category)    log.warn(`Command "${command.name}" is missing a category`, { file });

      if (client.commands.has(command.name)) {
        log.warn(`Duplicate command name "${command.name}" in ${file} — skipping`);
        continue;
      }

      // ── Feature flag gate ──────────────────────────────────────────────
      const featureKey = command.category.toLowerCase();
      if (!isFeatureEnabled(featureKey)) {
        log.debug(`Skipping command "${command.name}" — feature "${featureKey}" is disabled in config.json`);
        continue;
      }

      client.commands.set(command.name, command);

      for (const alias of command.aliases ?? []) {
        if (client.aliases.has(alias)) {
          log.warn(`Duplicate alias "${alias}" for command "${command.name}" — skipping alias`);
          continue;
        }
        client.aliases.set(alias, command.name);
      }

      loaded++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Failed to load command file: ${file}`, { error: message });
    }
  }

  // ── Register component handlers ──────────────────────────────────────────
  for (const command of client.commands.values()) {
    if (command.registerComponents) {
      try { command.registerComponents(client); }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        log.error(`registerComponents failed for "${command.name}"`, { error: message });
      }
    }
  }

  log.info(`Loaded ${loaded} commands from ${files.length} files`);
  return loaded;
}
