import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type MessageComponentInteraction,
} from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { topCommands } from "../../handlers/commandHandler.js";

// ─────────────────────────────────────────────────────────────────────────────
// Help System — v0.1.7
// Features:
//  • Category overview with navigation select menu
//  • Paginated command listing (page X/Y, jump-to-first/last, prev/next)
//  • Fuzzy search with smart suggestions (3 closest commands + one-click buttons)
//  • Full command detail — description, permissions (user + bot), cooldown,
//    aliases, premium flag, guild-only, usage examples
//  • Recently-viewed command tracking per user (session-based, last 5)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  Admin:           "⚙️",
  AI:              "🤖",
  Economy:         "💰",
  Games:           "🎮",
  General:         "🏠",
  Giveaways:       "🎉",
  Leveling:        "📈",
  Logging:         "📋",
  Moderation:      "🛡️",
  Music:           "🎵",
  Owner:           "🔑",
  "Reaction Roles":"🔔",
  Roles:           "🎭",
  Scheduler:       "⏰",
  Settings:        "🎛️",
  Tickets:         "🎫",
  Utility:         "🛠️",
  Verification:    "✅",
  Welcome:         "👋",
};

const PER_PAGE = 15;

/** Session-based recently viewed: userId → command name list */
const recentlyViewed = new Map<string, string[]>();

function recordRecent(userId: string, commandName: string): void {
  const list     = recentlyViewed.get(userId) ?? [];
  const filtered = list.filter((n) => n !== commandName);
  recentlyViewed.set(userId, [commandName, ...filtered].slice(0, 5));
}

// ─── Fuzzy search ─────────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

function fuzzySearch(query: string, commands: CommandDefinition[], limit = 10): CommandDefinition[] {
  const q      = query.toLowerCase().trim();
  const scored = commands.map((cmd) => {
    const fields = [cmd.name, ...(cmd.aliases ?? []), cmd.description.toLowerCase(), cmd.category.toLowerCase()];
    let score    = Infinity;
    for (const field of fields) {
      if (field === q)           { score = 0; break; }
      if (field.startsWith(q))  { score = Math.min(score, 1); continue; }
      if (field.includes(q))    { score = Math.min(score, 2); continue; }
      const dist = levenshtein(q, field.slice(0, q.length + 3));
      if (dist <= 2) score = Math.min(score, dist + 3);
    }
    return { cmd, score };
  });
  return scored.filter((s) => s.score < Infinity).sort((a, b) => a.score - b.score).map((s) => s.cmd).slice(0, limit);
}

// ─── Embed builders ──────────────────────────────────────────────────────────
function buildOverviewEmbed(
  client: { commands: Map<string, CommandDefinition> },
  prefix: string,
  guildId: string | null,
) {
  const categories = new Map<string, { total: number; premium: number }>();
  for (const cmd of client.commands.values()) {
    const entry = categories.get(cmd.category) ?? { total: 0, premium: 0 };
    entry.total++;
    if (cmd.premium) entry.premium++;
    categories.set(cmd.category, entry);
  }
  const sorted = [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const embed = EmbedFactory.base("primary")
    .setTitle("📖 Panindigan — Help Center")
    .setDescription(
      `Use \`/command\` or \`${prefix}command\` for any command.\n` +
      `**Select a category below** or type \`/help [command]\` for command details.\n` +
      `Use \`/help search [query]\` to search for any command.\n\u200b`,
    );

  // ── Frequently used (per-guild hit counter) ────────────────────────────────
  const top = topCommands(guildId, 5);
  if (top.length) {
    embed.addFields({
      name:   "🔥 Frequently Used",
      value:  top.map((t) => `\`/${t.name}\` — ${t.hits} use${t.hits !== 1 ? "s" : ""}`).join("\n"),
      inline: false,
    });
  }

  embed.addFields(
    sorted.map(([cat, info]) => ({
      name:   `${CATEGORY_ICONS[cat] ?? "📂"} ${cat}`,
      value:  `${info.total} command${info.total !== 1 ? "s" : ""}${info.premium ? ` (${info.premium} ⭐)` : ""}`,
      inline: true,
    })),
  ).setFooter({ text: `${client.commands.size} commands loaded • ⭐ = Premium` });

  return embed;
}

function buildCategoryEmbed(commands: CommandDefinition[], category: string, page: number) {
  const totalPages = Math.max(1, Math.ceil(commands.length / PER_PAGE));
  const slice      = commands.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const icon       = CATEGORY_ICONS[category] ?? "📂";
  const embed      = EmbedFactory.base("primary")
    .setTitle(`${icon} ${category} Commands`)
    .setDescription(
      slice.map((c) =>
        `\`${c.name}\`${c.premium ? " ⭐" : ""}${c.aliases?.length ? ` *(${c.aliases[0]})*` : ""} — ${c.description}`,
      ).join("\n") || "No commands in this category.",
    )
    .setFooter({ text: `${commands.length} commands • Page ${page}/${totalPages} • ⭐ = Premium` });
  return { embed, totalPages };
}

function buildCommandEmbed(cmd: CommandDefinition, prefix: string) {
  const embed = EmbedFactory.base("primary")
    .setTitle(`📖 ${cmd.name}`)
    .setDescription(cmd.description);

  embed.addFields(
    { name: "Category",   value: `${CATEGORY_ICONS[cmd.category] ?? "📂"} ${cmd.category}`, inline: true },
    {
      name:   "Access",
      value:  ({ owner: "🔑 Owner", coowner: "👑 Co-Owner", admin: "⚙️ Admin", moderator: "🛡️ Moderator", general: "👥 Everyone" } as Record<string, string>)[cmd.access] ?? cmd.access,
      inline: true,
    },
    { name: "Premium",    value: cmd.premium ? "⭐ Yes" : "No",                              inline: true },
    { name: "Guild Only", value: cmd.guildOnly === false ? "No (works in DMs)" : "Yes",       inline: true },
    { name: "Cooldown",   value: cmd.cooldown ? `⏱️ ${cmd.cooldown}s` : "None",               inline: true },
  );

  // ── Permission indicators ─────────────────────────────────────────────────
  if (cmd.memberPermissions?.length) {
    embed.addFields({
      name:   "🔐 Required User Permissions",
      value:  (cmd.memberPermissions as string[]).join(", "),
      inline: false,
    });
  }
  if (cmd.botPermissions?.length) {
    embed.addFields({
      name:   "🤖 Required Bot Permissions",
      value:  (cmd.botPermissions as string[]).join(", "),
      inline: false,
    });
  }

  if (cmd.aliases?.length) {
    embed.addFields({ name: "Aliases", value: cmd.aliases.map((a) => `\`${a}\``).join(", "), inline: false });
  }

  embed.addFields({
    name:   "Usage",
    value:  `Slash: \`/${cmd.name}\`\nPrefix: \`${prefix}${cmd.name}\``,
    inline: false,
  });

  return embed;
}

function buildSearchEmbed(results: CommandDefinition[], query: string) {
  if (!results.length) {
    return EmbedFactory.warning(
      `No commands matched \`${query}\`.\n\nTry a different spelling, or use \`/help\` to browse all categories.`,
      "🔍 No Results Found",
    );
  }
  return EmbedFactory.base("primary")
    .setTitle(`🔍 Search: "${query}"`)
    .setDescription(
      results.map((c, i) =>
        `**${i + 1}.** \`${c.name}\`${c.premium ? " ⭐" : ""} — ${c.description}`,
      ).join("\n"),
    )
    .setFooter({ text: `${results.length} result${results.length !== 1 ? "s" : ""} • ⭐ = Premium` });
}

// ─── Component builders ──────────────────────────────────────────────────────
function overviewSelectMenu(categories: string[]) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("help:category:v1")
    .setPlaceholder("Browse a category…");
  for (const cat of categories) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(cat)
        .setValue(cat)
        .setEmoji(CATEGORY_ICONS[cat] ?? "📂"),
    );
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

function navButtons(page: number, totalPages: number, category: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`help:first:${category}:v1`)
      .setLabel("⏮ First")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`help:prev:${category}:${page}:v1`)
      .setLabel("◀ Prev")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`help:page:${category}:${page}:v1`)
      .setLabel(`${page} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`help:next:${category}:${page}:v1`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
    new ButtonBuilder()
      .setCustomId(`help:last:${category}:${totalPages}:v1`)
      .setLabel("Last ⏭")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
  );
}

/** Build up to 3 one-click suggestion buttons for fuzzy-matched commands. */
function suggestionButtons(suggestions: CommandDefinition[]): ActionRowBuilder<ButtonBuilder> | null {
  if (!suggestions.length) return null;
  const row = new ActionRowBuilder<ButtonBuilder>();
  for (const cmd of suggestions.slice(0, 3)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`help:cmd:${cmd.name}:v1`)
        .setLabel(`/${cmd.name}`)
        .setStyle(ButtonStyle.Primary),
    );
  }
  return row;
}

// ─── Command definition ───────────────────────────────────────────────────────
const command: CommandDefinition = {
  name:        "help",
  description: "Browse all commands, search by name or keyword, or view detailed command info",
  category:    "General",
  access:      "general",
  guildOnly:   false,
  cooldown:    3,
  aliases:     ["h", "commands", "cmds"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("query").setDescription("Command name, category, or keyword to search for").setRequired(false),
    ),

  async execute(ctx) {
    const query    = (ctx.isSlash ? ctx.interaction!.options.getString("query") : ctx.args.join(" "))?.trim().toLowerCase();
    const prefix   = String((ctx.client as unknown as { config: Record<string, Record<string, string>> }).config?.bot?.defaultPrefix ?? "p!");
    const allCmds  = [...ctx.client.commands.values()] as CommandDefinition[];

    // ── Search mode ──────────────────────────────────────────────────────────
    if (query?.startsWith("search ")) {
      const q       = query.slice(7).trim();
      const results = fuzzySearch(q, allCmds);
      const embed   = buildSearchEmbed(results, q);

      if (!results.length) {
        // Show closest 3 suggestions with one-click buttons
        const suggestions = fuzzySearch(q, allCmds, 3);
        const btnRow       = suggestionButtons(suggestions);
        await ctx.reply({
          embeds:     [embed],
          components: btnRow ? [btnRow] : [],
          ephemeral:  false,
        });
      } else {
        await ctx.reply({ embeds: [embed] });
      }
      return;
    }

    // ── Specific command lookup ───────────────────────────────────────────────
    if (query) {
      const cmd =
        ctx.client.commands.get(query) ??
        ctx.client.commands.get(ctx.client.aliases.get(query) ?? "") ??
        null;

      if (cmd) {
        recordRecent(ctx.userId, cmd.name);
        const embed = buildCommandEmbed(cmd as CommandDefinition, prefix);

        const recent = (recentlyViewed.get(ctx.userId) ?? []).filter((n) => n !== cmd.name).slice(0, 4);
        if (recent.length) {
          embed.addFields({ name: "Recently Viewed", value: recent.map((n) => `\`${n}\``).join("  "), inline: false });
        }

        await ctx.reply({ embeds: [embed] });
        return;
      }

      // Category lookup
      const categoryCommands = allCmds.filter((c) => c.category.toLowerCase() === query);
      if (categoryCommands.length) {
        const { embed } = buildCategoryEmbed(categoryCommands, categoryCommands[0]!.category, 1);
        await ctx.reply({ embeds: [embed] });
        return;
      }

      // Fuzzy fallback with suggestion buttons
      const fuzzy    = fuzzySearch(query, allCmds);
      const embed    = buildSearchEmbed(fuzzy, query);
      const btnRow   = fuzzy.length === 0 ? suggestionButtons(fuzzySearch(query, allCmds, 3)) : null;
      await ctx.reply({ embeds: [embed], components: btnRow ? [btnRow] : [] });
      return;
    }

    // ── Overview (interactive for slash, static for prefix) ──────────────────
    const categories    = [...new Set(allCmds.map((c) => c.category))].sort();
    const overviewEmbed = buildOverviewEmbed(ctx.client as unknown as { commands: Map<string, CommandDefinition> }, prefix, ctx.guildId);
    const selectRow     = overviewSelectMenu(categories);

    if (!ctx.isSlash) {
      await ctx.reply({ embeds: [overviewEmbed] });
      return;
    }

    await ctx.reply({ embeds: [overviewEmbed], components: [selectRow] });

    const msg       = await ctx.interaction!.fetchReply();
    const collector = msg.createMessageComponentCollector({
      filter: (i: MessageComponentInteraction) => i.user.id === ctx.userId,
      time:   5 * 60_000,
    });

    let currentCategory = "";
    let currentPage     = 1;

    collector.on("collect", async (i: MessageComponentInteraction) => {
      await i.deferUpdate().catch(() => null);

      // ── Category select ───────────────────────────────────────────────────
      if (i.componentType === ComponentType.StringSelect && i.customId.startsWith("help:category")) {
        currentCategory = (i as unknown as { values: string[] }).values[0]!;
        currentPage     = 1;
        const cmds               = allCmds.filter((c) => c.category === currentCategory);
        const { embed, totalPages } = buildCategoryEmbed(cmds, currentCategory, currentPage);
        await i.editReply({ embeds: [embed], components: [navButtons(currentPage, totalPages, currentCategory)] });
        return;
      }

      // ── Navigation buttons ────────────────────────────────────────────────
      if (i.componentType === ComponentType.Button) {
        const parts  = i.customId.split(":");
        const action = parts[1];
        const cat    = parts[2] ?? currentCategory;
        const pageN  = parseInt(parts[3] ?? "1", 10);

        if (action === "back") {
          currentCategory = "";
          currentPage     = 1;
          await i.editReply({ embeds: [overviewEmbed], components: [selectRow] });
          return;
        }

        if (action === "cmd") {
          // One-click suggestion button
          const cmdName = parts[2];
          const cmd     = ctx.client.commands.get(cmdName ?? "");
          if (cmd) {
            recordRecent(ctx.userId, cmd.name);
            await i.editReply({ embeds: [buildCommandEmbed(cmd, prefix)], components: [] });
          }
          return;
        }

        const cmds      = allCmds.filter((c) => c.category === cat);
        const maxPages  = Math.max(1, Math.ceil(cmds.length / PER_PAGE));
        const targetPage =
          action === "first" ? 1
          : action === "last" ? maxPages
          : action === "prev" ? Math.max(1, pageN - 1)
          : action === "next" ? Math.min(maxPages, pageN + 1)
          : currentPage;

        const { embed, totalPages } = buildCategoryEmbed(cmds, cat, targetPage);
        currentCategory = cat;
        currentPage     = targetPage;

        await i.editReply({ embeds: [embed], components: [navButtons(currentPage, totalPages, currentCategory)] });
      }
    });

    collector.on("end", async () => {
      try { await ctx.interaction!.editReply({ components: [] }); }
      catch { /* message may have been deleted */ }
    });
  },
};

export default command;
