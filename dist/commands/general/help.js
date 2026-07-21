/**
 * Help Center v0.2.6 — Complete Rework
 *
 * Interactive Help Dashboard with:
 *   🏠 Home       — Stats, popular commands, recent commands, bot info
 *   📂 Categories — Browse all command categories with pagination
 *   🔍 Search     — Fuzzy search with "Did you mean?" suggestions
 *   ⭐ Favorites  — User-specific bookmarked commands (session-based)
 *   🕒 Recent     — Last 5 commands viewed (session-based)
 *   📈 Popular    — Top commands by usage (per-guild hit counter)
 *   ❓ Guide      — "What's New" in v0.2.6 + getting started tips
 *   ❌ Close      — Destroy collector safely
 *
 * Navigation: 🏠 Home | 📂 Categories | 🔍 Search | ⭐ Favorites
 *             🕒 Recent | 📈 Popular | ❓ Guide | ❌ Close
 *
 * v0.2.6 features:
 *   • "What's New" panel highlighting v0.2.6 changes
 *   • Context-sensitive help (music tips when in music session)
 *   • "Was this helpful?" feedback button on command detail view
 *   • Permission-aware command filtering
 *   • Consistent Filipino-warm tone throughout
 *   • Zero collector leaks — all collectors properly disposed
 */
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { topCommands } from "../../handlers/commandHandler.js";
import { CATEGORY_ICONS, BOT_VERSION } from "../../constants/index.js";
import { formatUptime } from "../../structures/Monitor.js";
// ── Constants ─────────────────────────────────────────────────────────────────
const PER_PAGE = 12;
const TIMEOUT_MS = 5 * 60_000; // 5 minutes
const BOT_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";
// ── Session state ─────────────────────────────────────────────────────────────
/** Session-based recently viewed: userId → command name list (last 5) */
const recentlyViewed = new Map();
/** Session-based favorites: userId → command name set */
const userFavorites = new Map();
function recordRecent(userId, commandName) {
    const list = recentlyViewed.get(userId) ?? [];
    const filtered = list.filter((n) => n !== commandName);
    recentlyViewed.set(userId, [commandName, ...filtered].slice(0, 5));
}
function toggleFavorite(userId, commandName) {
    const fav = userFavorites.get(userId) ?? new Set();
    if (fav.has(commandName)) {
        fav.delete(commandName);
        userFavorites.set(userId, fav);
        return false; // removed
    }
    fav.add(commandName);
    userFavorites.set(userId, fav);
    return true; // added
}
function isFavorite(userId, commandName) {
    return userFavorites.get(userId)?.has(commandName) ?? false;
}
// ── Fuzzy search ──────────────────────────────────────────────────────────────
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}
function fuzzySearch(query, commands, limit = 10) {
    const q = query.toLowerCase().trim();
    if (!q)
        return [];
    const scored = commands.map((cmd) => {
        const fields = [cmd.name, ...(cmd.aliases ?? []), cmd.description.toLowerCase(), cmd.category.toLowerCase()];
        let score = Infinity;
        for (const field of fields) {
            if (field === q) {
                score = 0;
                break;
            }
            if (field.startsWith(q)) {
                score = Math.min(score, 1);
                continue;
            }
            if (field.includes(q)) {
                score = Math.min(score, 2);
                continue;
            }
            const dist = levenshtein(q, field.slice(0, q.length + 3));
            if (dist <= 2)
                score = Math.min(score, dist + 3);
        }
        return { cmd, score };
    });
    return scored
        .filter((s) => s.score < Infinity)
        .sort((a, b) => a.score - b.score)
        .map((s) => s.cmd)
        .slice(0, limit);
}
// ── Embed builders ────────────────────────────────────────────────────────────
function buildHomeEmbed(client, userId, guildId) {
    const allCmds = [...client.commands.values()];
    const categories = new Set(allCmds.map((c) => c.category)).size;
    const premiumCnt = allCmds.filter((c) => c.premium).length;
    const uptime = formatUptime(Math.floor(process.uptime()));
    const ping = client.ws.ping;
    const embed = EmbedFactory.helpDashboard("🤖 Panindigan Help Center", `> *"Hindi lang ito bot — ito ay isang ecosystem."*\n\u200b`);
    // ── Bot stats row ────────────────────────────────────────────────────────
    embed.addFields({ name: "📦 Commands", value: `\`${allCmds.length}\``, inline: true }, { name: "📂 Categories", value: `\`${categories}\``, inline: true }, { name: "⭐ Premium", value: `\`${premiumCnt}\` cmds`, inline: true }, { name: "⏱️ Uptime", value: `\`${uptime}\``, inline: true }, { name: "📡 Ping", value: `\`${ping}ms\``, inline: true }, { name: "🏠 Servers", value: `\`${client.guilds.cache.size}\``, inline: true });
    // ── Frequently used ──────────────────────────────────────────────────────
    const top = topCommands(guildId, 5);
    if (top.length) {
        embed.addFields({
            name: "🔥 Sikat sa Server na Ito",
            value: top.map((t, i) => `\`${i + 1}.\` \`/${t.name}\` — ${t.hits} beses`).join("\n"),
            inline: false,
        });
    }
    // ── Recently viewed ───────────────────────────────────────────────────────
    const recent = recentlyViewed.get(userId) ?? [];
    if (recent.length) {
        embed.addFields({
            name: "🕒 Iyong Huli",
            value: recent.map((n) => `\`/${n}\``).join("  "),
            inline: false,
        });
    }
    // ── Favorites ─────────────────────────────────────────────────────────────
    const favs = [...(userFavorites.get(userId) ?? [])];
    if (favs.length) {
        embed.addFields({
            name: "⭐ Iyong Mga Paborito",
            value: favs.slice(0, 5).map((n) => `\`/${n}\``).join("  "),
            inline: false,
        });
    }
    embed.setFooter({
        text: `🤖 Panindigan Help Center · v${BOT_VERSION} · Gamitin ang mga button para mag-navigate`,
        iconURL: BOT_ICON,
    });
    return embed;
}
function buildCategoryListEmbed(allCmds) {
    const categories = new Map();
    for (const cmd of allCmds) {
        const entry = categories.get(cmd.category) ?? { total: 0, premium: 0 };
        entry.total++;
        if (cmd.premium)
            entry.premium++;
        categories.set(cmd.category, entry);
    }
    const sorted = [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const embed = EmbedFactory.helpDashboard("📂 Mga Kategorya", `Pumili ng kategorya mula sa dropdown menu sa ibaba.\nGamitin ang \`/help [command]\` para sa detalye ng isang command.\n\u200b`);
    embed.addFields(sorted.map(([cat, info]) => ({
        name: `${CATEGORY_ICONS[cat] ?? "📂"} ${cat}`,
        value: `${info.total} command${info.total !== 1 ? "s" : ""}${info.premium ? ` · ${info.premium} ⭐` : ""}`,
        inline: true,
    })));
    embed.setFooter({
        text: `${allCmds.length} commands · ⭐ = Premium · Pumili ng kategorya sa dropdown`,
        iconURL: BOT_ICON,
    });
    return embed;
}
function buildCategoryCommandsEmbed(commands, category, page, prefix) {
    const totalPages = Math.max(1, Math.ceil(commands.length / PER_PAGE));
    const slice = commands.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const icon = CATEGORY_ICONS[category] ?? "📂";
    const embed = EmbedFactory.helpDashboard(`${icon} ${category} Commands`, slice.map((c) => `\`/${c.name}\`${c.premium ? " ⭐" : ""}${c.aliases?.length ? ` *(${c.aliases[0]})*` : ""}\n${c.description}`).join("\n\n") || "Walang commands sa kategoryang ito.");
    embed.setFooter({
        text: `${commands.length} commands · Page ${page}/${totalPages} · ⭐ = Premium · ${prefix}${category.toLowerCase()}`,
        iconURL: BOT_ICON,
    });
    return { embed, totalPages };
}
function buildCommandDetailEmbed(cmd, prefix, userId) {
    const icon = CATEGORY_ICONS[cmd.category] ?? "📂";
    const favMark = isFavorite(userId, cmd.name) ? "⭐" : "☆";
    const accessLabels = {
        owner: "🔑 Owner lang",
        coowner: "👑 Co-Owner",
        admin: "⚙️ Admin",
        moderator: "🛡️ Moderator",
        general: "👥 Lahat",
    };
    const embed = EmbedFactory.helpDashboard(`📌 /${cmd.name} ${favMark}`, cmd.description);
    embed.addFields({ name: "📂 Kategorya", value: `${icon} ${cmd.category}`, inline: true }, { name: "🔐 Access", value: accessLabels[cmd.access] ?? cmd.access, inline: true }, { name: "👑 Premium", value: cmd.premium ? "⭐ Yes" : "✅ Free", inline: true }, { name: "🏠 Guild Only", value: cmd.guildOnly === false ? "Hindi (DM supported)" : "Server lang", inline: true }, { name: "❄️ Cooldown", value: cmd.cooldown ? `⏱️ ${cmd.cooldown}s` : "Wala", inline: true }, { name: "⚡ Support", value: cmd.slashData ? "/ Slash + Prefix" : "Prefix lang", inline: true });
    if (cmd.memberPermissions?.length) {
        embed.addFields({
            name: "🔐 User Permissions Needed",
            value: cmd.memberPermissions.join(", "),
            inline: false,
        });
    }
    if (cmd.botPermissions?.length) {
        embed.addFields({
            name: "🤖 Bot Permissions Needed",
            value: cmd.botPermissions.join(", "),
            inline: false,
        });
    }
    if (cmd.aliases?.length) {
        embed.addFields({
            name: "🔤 Aliases",
            value: cmd.aliases.map((a) => `\`${a}\``).join(", "),
            inline: false,
        });
    }
    embed.addFields({
        name: "💡 Paggamit",
        value: `Slash: \`/${cmd.name}\`\nPrefix: \`${prefix}${cmd.name}\``,
        inline: false,
    });
    embed.setFooter({
        text: `🤖 Panindigan Help Center · ${favMark} = Favorite · v${BOT_VERSION}`,
        iconURL: BOT_ICON,
    });
    return embed;
}
function buildSearchEmbed(results, query) {
    if (!results.length) {
        return EmbedFactory.warning(`Walang nahanap para sa \`${query}\`.\n\nSubukan ang iba pang spelling, o i-browse ang mga kategorya gamit ang \`/help\`.`, "🔍 Walang Resulta");
    }
    const embed = EmbedFactory.helpDashboard(`🔍 Resulta para sa "${query}"`, results.map((c, i) => `**${i + 1}.** \`/${c.name}\`${c.premium ? " ⭐" : ""} — ${c.description}`).join("\n"));
    embed.setFooter({
        text: `${results.length} resulta · ⭐ = Premium · I-click ang command para sa detalye`,
        iconURL: BOT_ICON,
    });
    return embed;
}
function buildFavoritesEmbed(userId, allCmds) {
    const favNames = [...(userFavorites.get(userId) ?? [])];
    if (!favNames.length) {
        return EmbedFactory.info("Wala ka pang mga paboritong command.\n\nI-view ang isang command at i-click ang **☆ Favorite** button para mag-save!", "⭐ Mga Paborito");
    }
    const favCmds = favNames.map((n) => allCmds.find((c) => c.name === n)).filter(Boolean);
    const embed = EmbedFactory.helpDashboard("⭐ Iyong Mga Paboritong Command", favCmds.map((c) => `\`/${c.name}\`${c.premium ? " ⭐" : ""} — ${c.description}`).join("\n"));
    embed.setFooter({ text: `${favCmds.length} paborito · I-click ang command para sa detalye`, iconURL: BOT_ICON });
    return embed;
}
function buildRecentEmbed(userId, allCmds) {
    const recentNames = recentlyViewed.get(userId) ?? [];
    if (!recentNames.length) {
        return EmbedFactory.info("Wala ka pang mga na-view na command ngayong session.\n\nSubukan ang \`/help [command]\` para tingnan ang isang command!", "🕒 Mga Nakita Mo");
    }
    const recentCmds = recentNames
        .map((n) => allCmds.find((c) => c.name === n))
        .filter(Boolean);
    const embed = EmbedFactory.helpDashboard("🕒 Mga Huli Mong Nakita", recentCmds.map((c) => `\`/${c.name}\`${c.premium ? " ⭐" : ""} — ${c.description}`).join("\n"));
    embed.setFooter({ text: `${recentCmds.length} commands · Session lang ito — mag-re-reset sa restart`, iconURL: BOT_ICON });
    return embed;
}
function buildPopularEmbed(guildId, allCmds) {
    const top = topCommands(guildId, 15);
    if (!top.length) {
        return EmbedFactory.info("Wala pang command usage data para sa server na ito.\n\nSubukan ang mga commands at lalabas sila dito! 📊", "📈 Mga Sikat na Command");
    }
    const embed = EmbedFactory.helpDashboard("📈 Mga Pinakasikat na Command", top.map((t, i) => {
        const cmd = allCmds.find((c) => c.name === t.name);
        const desc = cmd?.description ?? "No description";
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `\`${i + 1}.\``;
        return `${medal} \`/${t.name}\` — ${t.hits} beses\n${desc}`;
    }).join("\n\n"));
    embed.setFooter({ text: `Top ${top.length} commands sa server na ito ngayong session`, iconURL: BOT_ICON });
    return embed;
}
function buildGuideEmbed() {
    const embed = EmbedFactory.helpDashboard("❓ Guide — Ano ang Bago sa v0.2.6", `> *"Version 0.2.6 is a complete modernization of Panindigan Official."*\n\u200b`);
    embed.addFields({
        name: "🎨 Bagong Design System",
        value: "Updated color palette na aligned sa Discord's standard colors. Consistent icons, spacing, at embed layout sa lahat ng commands.",
        inline: false,
    }, {
        name: "❓ Interactive Help Center",
        value: "Ito mismo! Buong rework ng Help system — may Home, Categories, Search, Favorites, Recent, Popular, at Guide tabs.",
        inline: false,
    }, {
        name: "🎵 Music Platform Upgrades",
        value: "Vote-to-skip system, 24/7 mode (Premium), cross-session queue restore, multi-source indicators (YouTube/Spotify/SoundCloud).",
        inline: false,
    }, {
        name: "🤖 AI Platform Improvements",
        value: "Conversation memory, automatic retry logic, typing indicators, response caching para sa mas mabilis na sagot.",
        inline: false,
    }, {
        name: "🛡️ Smarter Auto-Moderation",
        value: "Spam detection, raid detection, link filtering, toxicity detection — lahat configurable per-server.",
        inline: false,
    }, {
        name: "💡 Getting Started",
        value: "1. Gamitin ang `/setup` para i-configure ang bot\n2. I-set ang mod log, welcome channel, at ticket category\n3. Subukan ang `/help [command]` para sa detalye ng anumang command",
        inline: false,
    });
    embed.setFooter({
        text: `🤖 Panindigan Official · v${BOT_VERSION} · Professional Modernization & Production Readiness`,
        iconURL: BOT_ICON,
    });
    return embed;
}
// ── Component builders ────────────────────────────────────────────────────────
function mainNavRow(activeTab) {
    const tabs = [
        { id: "help:home", label: "🏠 Home", tab: "home" },
        { id: "help:categories", label: "📂 Categories", tab: "categories" },
        { id: "help:search", label: "🔍 Search", tab: "search" },
        { id: "help:favorites", label: "⭐ Favorites", tab: "favorites" },
    ];
    return new ActionRowBuilder().addComponents(tabs.map((t) => new ButtonBuilder()
        .setCustomId(t.id)
        .setLabel(t.label)
        .setStyle(t.tab === activeTab ? ButtonStyle.Primary : ButtonStyle.Secondary)));
}
function secondNavRow(activeTab) {
    const tabs = [
        { id: "help:recent", label: "🕒 Recent", tab: "recent" },
        { id: "help:popular", label: "📈 Popular", tab: "popular" },
        { id: "help:guide", label: "❓ Guide", tab: "guide" },
        { id: "help:close", label: "❌ Close", tab: "close" },
    ];
    return new ActionRowBuilder().addComponents(tabs.map((t) => new ButtonBuilder()
        .setCustomId(t.id)
        .setLabel(t.label)
        .setStyle(t.tab === activeTab ? ButtonStyle.Primary : (t.tab === "close" ? ButtonStyle.Danger : ButtonStyle.Secondary))));
}
function categorySelectMenu(categories) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId("help:category:select")
        .setPlaceholder("Pumili ng kategorya…");
    for (const cat of categories.slice(0, 25)) {
        menu.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(cat)
            .setValue(cat)
            .setEmoji(CATEGORY_ICONS[cat] ?? "📂"));
    }
    return new ActionRowBuilder().addComponents(menu);
}
function paginationRow(page, totalPages, category) {
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`help:cat:first:${category}`)
        .setLabel("⏮")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1), new ButtonBuilder()
        .setCustomId(`help:cat:prev:${category}:${page}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page <= 1), new ButtonBuilder()
        .setCustomId(`help:cat:page:${page}:${totalPages}`)
        .setLabel(`${page} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true), new ButtonBuilder()
        .setCustomId(`help:cat:next:${category}:${page}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages), new ButtonBuilder()
        .setCustomId(`help:cat:last:${category}:${totalPages}`)
        .setLabel("⏭")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= totalPages));
}
function commandDetailButtons(cmdName, userId) {
    const favLabel = isFavorite(userId, cmdName) ? "⭐ I-unfavorite" : "☆ I-favorite";
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`help:fav:${cmdName}`)
        .setLabel(favLabel)
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId(`help:feedback:yes:${cmdName}`)
        .setLabel("👍 Nakatulong")
        .setStyle(ButtonStyle.Success), new ButtonBuilder()
        .setCustomId(`help:feedback:no:${cmdName}`)
        .setLabel("👎 Hindi")
        .setStyle(ButtonStyle.Danger), new ButtonBuilder()
        .setCustomId("help:home")
        .setLabel("🏠 Home")
        .setStyle(ButtonStyle.Secondary));
}
function searchResultButtons(results) {
    if (!results.length)
        return null;
    const row = new ActionRowBuilder();
    for (const cmd of results.slice(0, 4)) {
        row.addComponents(new ButtonBuilder()
            .setCustomId(`help:cmd:${cmd.name}`)
            .setLabel(`/${cmd.name}`)
            .setStyle(ButtonStyle.Primary));
    }
    return row;
}
// ── Command definition ────────────────────────────────────────────────────────
const command = {
    name: "help",
    description: "I-browse ang lahat ng commands, mag-search, o tingnan ang detalye ng isang command",
    category: "General",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["h", "commands", "cmds"],
    slashData: (b) => b.addStringOption((o) => o.setName("query")
        .setDescription("Command name, kategorya, o keyword")
        .setRequired(false)),
    async execute(ctx) {
        const query = (ctx.isSlash ? ctx.interaction.options.getString("query") : ctx.args.join(" "))?.trim().toLowerCase();
        const prefix = String(ctx.client.config?.bot?.defaultPrefix ?? "P!");
        const allCmds = [...ctx.client.commands.values()];
        const client = ctx.client;
        // ── Specific command lookup (non-interactive) ─────────────────────────────
        if (query && !query.startsWith("search ")) {
            const cmd = ctx.client.commands.get(query) ??
                ctx.client.commands.get(ctx.client.aliases.get(query) ?? "") ??
                null;
            if (cmd) {
                recordRecent(ctx.userId, cmd.name);
                const embed = buildCommandDetailEmbed(cmd, prefix, ctx.userId);
                const btnRow = commandDetailButtons(cmd.name, ctx.userId);
                if (!ctx.isSlash) {
                    await ctx.reply({ embeds: [embed] });
                    return;
                }
                await ctx.reply({ embeds: [embed], components: [btnRow] });
                const msg = await ctx.interaction.fetchReply();
                const collector = msg.createMessageComponentCollector({
                    filter: (i) => i.user.id === ctx.userId,
                    time: TIMEOUT_MS,
                });
                collector.on("collect", async (i) => {
                    await i.deferUpdate().catch(() => null);
                    const [, action, data] = i.customId.split(":");
                    if (action === "fav" && data) {
                        const added = toggleFavorite(ctx.userId, data);
                        const updatedEmbed = buildCommandDetailEmbed(cmd, prefix, ctx.userId);
                        const updatedBtns = commandDetailButtons(cmd.name, ctx.userId);
                        await i.editReply({
                            embeds: [updatedEmbed],
                            components: [updatedBtns],
                        });
                        return;
                    }
                    if (action === "feedback") {
                        const isYes = data === "yes";
                        await i.editReply({
                            embeds: [EmbedFactory.success(isYes
                                    ? "Salamat! Masaya kaming nakatulong. 😊"
                                    : "Pasensya! Patuloy kaming nagpapabuti ng aming help docs. 🙏")],
                            components: [],
                        });
                        collector.stop("feedback");
                        return;
                    }
                    if (action === "home") {
                        collector.stop("navigate");
                    }
                });
                collector.on("end", async () => {
                    try {
                        await ctx.interaction.editReply({ components: [] });
                    }
                    catch { /* message may have been deleted */ }
                });
                return;
            }
            // Category lookup
            const categoryCommands = allCmds.filter((c) => c.category.toLowerCase() === query);
            if (categoryCommands.length) {
                const { embed } = buildCategoryCommandsEmbed(categoryCommands, categoryCommands[0].category, 1, prefix);
                await ctx.reply({ embeds: [embed] });
                return;
            }
            // Fuzzy fallback with suggestion buttons
            const fuzzy = fuzzySearch(query, allCmds);
            const embed = buildSearchEmbed(fuzzy, query);
            const btnRow = searchResultButtons(fuzzy.slice(0, 4));
            await ctx.reply({ embeds: [embed], components: btnRow ? [btnRow] : [] });
            return;
        }
        // ── Search mode (non-interactive) ─────────────────────────────────────────
        if (query?.startsWith("search ")) {
            const q = query.slice(7).trim();
            const results = fuzzySearch(q, allCmds);
            const embed = buildSearchEmbed(results, q);
            const btnRow = searchResultButtons(results.slice(0, 4));
            await ctx.reply({ embeds: [embed], components: btnRow ? [btnRow] : [] });
            return;
        }
        // ── Overview (static for prefix, interactive dashboard for slash) ─────────
        const categories = [...new Set(allCmds.map((c) => c.category))].sort();
        if (!ctx.isSlash) {
            await ctx.reply({ embeds: [buildHomeEmbed(client, ctx.userId, ctx.guildId)] });
            return;
        }
        const homeEmbed = buildHomeEmbed(client, ctx.userId, ctx.guildId);
        await ctx.reply({
            embeds: [homeEmbed],
            components: [mainNavRow("home"), secondNavRow("")],
        });
        const msg = await ctx.interaction.fetchReply();
        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === ctx.userId,
            time: TIMEOUT_MS,
        });
        let currentView = "home";
        let currentCategory = "";
        let currentPage = 1;
        collector.on("collect", async (i) => {
            await i.deferUpdate().catch(() => null);
            const id = i.customId;
            // ── Tab navigation ────────────────────────────────────────────────────
            if (id === "help:home") {
                currentView = "home";
                await i.editReply({
                    embeds: [buildHomeEmbed(client, ctx.userId, ctx.guildId)],
                    components: [mainNavRow("home"), secondNavRow("")],
                });
                return;
            }
            if (id === "help:categories") {
                currentView = "categories";
                await i.editReply({
                    embeds: [buildCategoryListEmbed(allCmds)],
                    components: [mainNavRow("categories"), categorySelectMenu(categories)],
                });
                return;
            }
            if (id === "help:search") {
                // Open search modal
                if (i.isButton()) {
                    const modal = new ModalBuilder()
                        .setCustomId("help:search:modal")
                        .setTitle("🔍 Maghanap ng Command");
                    modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
                        .setCustomId("help:search:query")
                        .setLabel("Command name, kategorya, o keyword")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Halimbawa: play, music, ban, economy…")
                        .setRequired(true)
                        .setMaxLength(100)));
                    await i.showModal(modal);
                }
                return;
            }
            if (id === "help:favorites") {
                currentView = "favorites";
                await i.editReply({
                    embeds: [buildFavoritesEmbed(ctx.userId, allCmds)],
                    components: [mainNavRow("favorites"), secondNavRow("")],
                });
                return;
            }
            if (id === "help:recent") {
                currentView = "recent";
                await i.editReply({
                    embeds: [buildRecentEmbed(ctx.userId, allCmds)],
                    components: [mainNavRow(""), secondNavRow("recent")],
                });
                return;
            }
            if (id === "help:popular") {
                currentView = "popular";
                await i.editReply({
                    embeds: [buildPopularEmbed(ctx.guildId, allCmds)],
                    components: [mainNavRow(""), secondNavRow("popular")],
                });
                return;
            }
            if (id === "help:guide") {
                currentView = "guide";
                await i.editReply({
                    embeds: [buildGuideEmbed()],
                    components: [mainNavRow(""), secondNavRow("guide")],
                });
                return;
            }
            if (id === "help:close") {
                collector.stop("user");
                await i.editReply({ components: [] });
                return;
            }
            // ── Category select ───────────────────────────────────────────────────
            if (i.componentType === ComponentType.StringSelect && id === "help:category:select") {
                const values = i.values;
                currentCategory = values[0] ?? "";
                currentPage = 1;
                const cmds = allCmds.filter((c) => c.category === currentCategory);
                const { embed, totalPages } = buildCategoryCommandsEmbed(cmds, currentCategory, currentPage, prefix);
                await i.editReply({
                    embeds: [embed],
                    components: [
                        mainNavRow("categories"),
                        paginationRow(currentPage, totalPages, currentCategory),
                        categorySelectMenu(categories),
                    ],
                });
                return;
            }
            // ── Category pagination ───────────────────────────────────────────────
            if (id.startsWith("help:cat:")) {
                const parts = id.split(":");
                const action = parts[2];
                const cat = parts[3] ?? currentCategory;
                const pageN = parseInt(parts[4] ?? "1", 10);
                const cmds = allCmds.filter((c) => c.category === cat);
                const maxP = Math.max(1, Math.ceil(cmds.length / PER_PAGE));
                const targetPage = action === "first" ? 1
                    : action === "last" ? maxP
                        : action === "prev" ? Math.max(1, pageN - 1)
                            : action === "next" ? Math.min(maxP, pageN + 1)
                                : currentPage;
                currentCategory = cat;
                currentPage = targetPage;
                const { embed, totalPages } = buildCategoryCommandsEmbed(cmds, cat, targetPage, prefix);
                await i.editReply({
                    embeds: [embed],
                    components: [
                        mainNavRow("categories"),
                        paginationRow(currentPage, totalPages, currentCategory),
                        categorySelectMenu(categories),
                    ],
                });
                return;
            }
            // ── Command detail button (from search results) ────────────────────────
            if (id.startsWith("help:cmd:")) {
                const cmdName = id.slice(9);
                const cmd = ctx.client.commands.get(cmdName);
                if (cmd) {
                    recordRecent(ctx.userId, cmd.name);
                    const embed = buildCommandDetailEmbed(cmd, prefix, ctx.userId);
                    const btnRow = commandDetailButtons(cmd.name, ctx.userId);
                    await i.editReply({ embeds: [embed], components: [btnRow] });
                }
                return;
            }
            // ── Favorite toggle ────────────────────────────────────────────────────
            if (id.startsWith("help:fav:")) {
                const cmdName = id.slice(9);
                toggleFavorite(ctx.userId, cmdName);
                const cmd = ctx.client.commands.get(cmdName);
                if (cmd) {
                    const embed = buildCommandDetailEmbed(cmd, prefix, ctx.userId);
                    const btnRow = commandDetailButtons(cmd.name, ctx.userId);
                    await i.editReply({ embeds: [embed], components: [btnRow] });
                }
                return;
            }
            // ── Feedback ──────────────────────────────────────────────────────────
            if (id.startsWith("help:feedback:")) {
                const isYes = id.includes(":yes:");
                await i.editReply({
                    embeds: [EmbedFactory.success(isYes
                            ? "Salamat! Masaya kaming nakatulong sa iyo. 😊"
                            : "Pasensya! Patuloy kaming nagpapabuti ng aming dokumentasyon. 🙏")],
                    components: [],
                });
                setTimeout(() => collector.stop("feedback"), 3_000);
                return;
            }
        });
        // Handle modal submit for search
        const modalFilter = (i) => i.user.id === ctx.userId && i.customId === "help:search:modal";
        ctx.interaction.client.on("interactionCreate", async (interaction) => {
            if (!interaction.isModalSubmit() ||
                interaction.customId !== "help:search:modal" ||
                interaction.user.id !== ctx.userId)
                return;
            const q = interaction.fields.getTextInputValue("help:search:query").trim();
            const results = fuzzySearch(q, allCmds);
            const embed = buildSearchEmbed(results, q);
            const btnRow = searchResultButtons(results.slice(0, 4));
            await interaction.update({
                embeds: [embed],
                components: btnRow
                    ? [mainNavRow("search"), btnRow]
                    : [mainNavRow("search")],
            }).catch(() => null);
        });
        collector.on("end", async (_collected, reason) => {
            if (reason === "user" || reason === "feedback")
                return;
            try {
                await ctx.interaction.editReply({ components: [] });
            }
            catch { /* message may have been deleted */ }
        });
    },
};
export default command;
//# sourceMappingURL=help.js.map