import type { ChatInputCommandInteraction } from "discord.js";
import type { PanindiganClient } from "../structures/Client.js";
import type { EventDefinition, RunContext, ComponentInteractionContext } from "../structures/types.js";
import { dispatchCommand } from "../handlers/commandHandler.js";
import { EmbedFactory } from "../structures/EmbedFactory.js";
import { globalRateLimit } from "../structures/RateLimitStore.js";
import { scopedLogger } from "../utils/logger.js";
import { isBotOwner } from "../utils/permissions.js";
import { isGuildPremium } from "../utils/premium.js";

const log = scopedLogger("interaction");

/** Dedup guard — ignore the same interaction ID received twice within 500 ms. */
const recentIds = new Map<string, number>();
setInterval(() => {
  const cutoff = Date.now() - 500;
  for (const [id, ts] of recentIds) if (ts < cutoff) recentIds.delete(id);
}, 1_000).unref();

function isDuplicate(id: string): boolean {
  if (recentIds.has(id)) return true;
  recentIds.set(id, Date.now());
  return false;
}

async function handleChatInput(client: PanindiganClient, interaction: ChatInputCommandInteraction): Promise<void> {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const args: string[] = [];
  interaction.options.data.forEach((opt) => {
    if (opt.value !== undefined) args.push(String(opt.value));
  });

  const ctx: RunContext = {
    client,
    guildId:  interaction.guildId,
    userId:   interaction.user.id,
    isSlash:  true,
    interaction,
    args,
    isOwner:      () => isBotOwner(interaction.user.id),
    isPremium:    async () => interaction.guildId ? isGuildPremium(interaction.guildId) : false,
    isMobileUser: () => {
      // Discord reports mobile clients via the member's presence; heuristic only
      const member = interaction.guild?.members.cache.get(interaction.user.id);
      return (member?.presence?.clientStatus as Record<string, string> | undefined)?.["mobile"] !== undefined;
    },
    hasCooldown: (commandName: string) => client.isOnCooldown(commandName, interaction.user.id, 0),
    reply: async (payload) => {
      if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
      return interaction.reply(payload as never);
    },
  };

  // ── Interaction timeout guard ──────────────────────────────────────────────
  // If the command defers but never resolves within 14.5 s, send a fallback.
  let resolved = false;
  const timeoutId = setTimeout(async () => {
    if (resolved) return;
    log.warn(`Interaction timeout for command "${interaction.commandName}"`, {
      userId:  interaction.user.id,
      guildId: interaction.guildId ?? "DM",
    });
    try {
      const msg = EmbedFactory.error("The command took too long to respond. Please try again.");
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ embeds: [msg] });
      } else if (!interaction.replied) {
        await interaction.reply({ embeds: [msg], ephemeral: true });
      } else {
        await interaction.followUp({ embeds: [msg], ephemeral: true });
      }
    } catch { /* already cleaned up */ }
  }, 14_500);

  try {
    await dispatchCommand(client, command, ctx, interaction.member as never);
  } finally {
    resolved = true;
    clearTimeout(timeoutId);
  }
}

function buildComponentContext(interaction: { customId: string; user: { id: string }; guildId: string | null }): ComponentInteractionContext {
  const parts  = interaction.customId.split(":");
  return {
    customId: interaction.customId,
    prefix:   parts[0] ?? "",
    parts,
    userId:   interaction.user.id,
    guildId:  interaction.guildId,
  };
}

const event: EventDefinition = {
  name: "interactionCreate",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execute(client, interaction: any) {
    const i = interaction as {
      id: string;
      isChatInputCommand(): boolean;
      isButton(): boolean;
      isAnySelectMenu(): boolean;
      isModalSubmit(): boolean;
      isAutocomplete(): boolean;
      isRepliable?(): boolean;
      replied?: boolean;
      deferred?: boolean;
      commandName?: string;
      customId?: string;
      user: { id: string };
      guildId: string | null;
      member: unknown;
      reply(p: unknown): Promise<unknown>;
      followUp(p: unknown): Promise<unknown>;
    };

    // ── Dedup ─────────────────────────────────────────────────────────────
    if (isDuplicate(i.id)) {
      log.debug("Duplicate interaction ignored", { id: i.id });
      return;
    }

    // ── Global rate limit ──────────────────────────────────────────────────
    const rateResult = globalRateLimit.hit(i.user.id);
    if (rateResult.limited) {
      const retryAfterSec = Math.ceil(rateResult.retryAfterMs / 1_000);
      log.warn("Global rate limit hit", { userId: i.user.id, retryAfterSec });
      if (i.isRepliable?.() && !i.replied) {
        await i.reply({
          embeds: [EmbedFactory.warning(`You're sending commands too fast. Please wait **${retryAfterSec}s** and try again.`)],
          ephemeral: true,
        }).catch(() => {});
      }
      return;
    }

    try {
      if (i.isChatInputCommand()) {
        await handleChatInput(client, i as unknown as ChatInputCommandInteraction);
        return;
      }

      if (i.isButton() || i.isAnySelectMenu() || i.isModalSubmit()) {
        const ctx    = buildComponentContext(i as { customId: string; user: { id: string }; guildId: string | null });
        const handler = client.componentHandlers.get(ctx.prefix);
        if (handler) {
          await handler(i);
        }
        return;
      }

      if (i.isAutocomplete()) {
        const command = client.commands.get(i.commandName ?? "");
        if (command?.autocomplete) {
          await command.autocomplete(i as never, client);
        }
        return;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack   = err instanceof Error ? err.stack : undefined;
      log.error("Unhandled interaction error", { error: message, stack, userId: i.user.id, guildId: i.guildId });

      const errEmbed = EmbedFactory.error("Something went wrong handling that interaction. The error has been logged.");
      try {
        if (i.isRepliable?.() && !i.replied && !i.deferred) {
          await i.reply({ embeds: [errEmbed], ephemeral: true });
        } else if (i.deferred && !i.replied) {
          await (i as any).editReply({ embeds: [errEmbed] });
        }
      } catch { /* already cleaned up */ }
    }
  },
};

export default event;
