/**
 * utils/dashboard.ts v0.2.6
 * Smart Dashboard Framework — reusable dashboard components for various features
 *
 * v0.2.6 Dashboard Features:
 *   📊 Statistics Cards — key metrics with visual indicators
 *   📈 Trend Indicators — up/down arrows with percentages
 *   🎯 Progress Bars — visual progress for goals/limits
 *   📋 Data Tables — sortable, paginated data displays
 *   🔔 Status Badges — operational, degraded, offline indicators
 *   🎨 Theme Support — consistent styling across dashboards
 *   🔄 Real-time Updates — refresh buttons and auto-refresh options
 */
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, } from "discord.js";
import { EmbedFactory } from "../structures/EmbedFactory.js";
import { COLORS } from "../constants/index.js";
// ── Stat card builders ───────────────────────────────────────────────────────────
/**
 * Build a stat card with trend indicator.
 */
export function buildStatCard(card) {
    const { label, value, trend, trendValue, icon, color } = card;
    const trendEmoji = trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️";
    const trendStr = trend && trendValue !== undefined
        ? ` ${trendEmoji} ${trendValue > 0 ? "+" : ""}${trendValue}%`
        : "";
    const iconStr = icon ? `${icon} ` : "";
    const colorStr = color ? `\`${color}\`` : "";
    return `${iconStr}**${label}**\n${colorStr}${value}${trendStr}`;
}
/**
 * Build multiple stat cards in a grid layout.
 */
export function buildStatGrid(cards, columns = 2) {
    const rows = [];
    for (let i = 0; i < cards.length; i += columns) {
        const row = cards.slice(i, i + columns);
        rows.push(row.map((card) => buildStatCard(card)));
    }
    return rows.map((row) => row.join(" │ ")).join("\n\n");
}
// ── Progress bar builder ─────────────────────────────────────────────────────────
/**
 * Build a visual progress bar.
 */
export function buildProgressBar(current, max, length = 20, filledChar = "█", emptyChar = "░") {
    const progress = Math.min(1, Math.max(0, current / max));
    const filled = Math.round(progress * length);
    const empty = length - filled;
    return `${filledChar.repeat(filled)}${emptyChar.repeat(empty)} ${Math.round(progress * 100)}%`;
}
/**
 * Build a progress bar with label and value.
 */
export function buildProgressSection(label, current, max, length = 20) {
    const bar = buildProgressBar(current, max, length);
    return `**${label}**\n${bar} (${current.toLocaleString()} / ${max.toLocaleString()})`;
}
/**
 * Build a status badge with emoji and color.
 */
export function buildStatusBadge(level) {
    const badges = {
        operational: { emoji: "✅", label: "Operational", color: COLORS.SUCCESS },
        degraded: { emoji: "⚠️", label: "Degraded", color: COLORS.WARNING },
        offline: { emoji: "❌", label: "Offline", color: COLORS.ERROR },
        maintenance: { emoji: "🔧", label: "Maintenance", color: COLORS.SURFACE },
    };
    return badges[level];
}
/**
 * Build a status line for dashboard.
 */
export function buildStatusLine(level, service) {
    const badge = buildStatusBadge(level);
    return `${badge.emoji} **${service}** — ${badge.label}`;
}
// ── Table builder ───────────────────────────────────────────────────────────────
/**
 * Build a markdown table from data.
 */
export function buildTable(data) {
    const { headers, rows, pageSize = 10 } = data;
    // If pageSize is specified, return paginated table
    if (pageSize && rows.length > pageSize) {
        return buildPaginatedTable(data, 1, pageSize);
    }
    // Build full table
    const headerRow = `│ ${headers.join(" │ ")} │`;
    const separatorRow = `│ ${headers.map(() => "─").join("─┼─")} │`;
    const dataRows = rows.map((row) => `│ ${row.join(" │ ")} │`);
    return `\`\`\`\n${headerRow}\n${separatorRow}\n${dataRows.join("\n")}\n\`\`\``;
}
/**
 * Build a paginated table.
 */
export function buildPaginatedTable(data, page, pageSize) {
    const { headers, rows } = data;
    const totalPages = Math.ceil(rows.length / pageSize);
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, rows.length);
    const pageRows = rows.slice(startIdx, endIdx);
    const headerRow = `│ ${headers.join(" │ ")} │`;
    const separatorRow = `│ ${headers.map(() => "─").join("─┼─")} │`;
    const dataRows = pageRows.map((row) => `│ ${row.join(" │ ")} │`);
    const table = `\`\`\`\n${headerRow}\n${separatorRow}\n${dataRows.join("\n")}\n\`\`\``;
    const pageInfo = `Page ${currentPage}/${totalPages} · ${rows.length} total rows`;
    return `${table}\n\n*${pageInfo}*`;
}
/**
 * Build table navigation buttons.
 */
export function buildTableNavigation(currentPage, totalPages, customIdPrefix) {
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}:first`)
        .setEmoji("⏮️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1), new ButtonBuilder()
        .setCustomId(`${customIdPrefix}:prev:${currentPage}`)
        .setEmoji("◀️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1), new ButtonBuilder()
        .setCustomId(`${customIdPrefix}:page:${currentPage}:${totalPages}`)
        .setLabel(`${currentPage} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true), new ButtonBuilder()
        .setCustomId(`${customIdPrefix}:next:${currentPage}`)
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages), new ButtonBuilder()
        .setCustomId(`${customIdPrefix}:last`)
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages));
}
// ── Main dashboard embed builder ─────────────────────────────────────────────────
/**
 * Build a comprehensive dashboard embed.
 */
export function buildDashboard(options, sections) {
    const { title, description, color, thumbnail, footer, timestamp = true } = options;
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color ?? COLORS.PRIMARY);
    if (description) {
        embed.setDescription(description);
    }
    if (thumbnail) {
        embed.setThumbnail(thumbnail);
    }
    // Add sections as fields
    for (const section of sections) {
        embed.addFields({
            name: section.title,
            value: section.content,
            inline: section.inline ?? false,
        });
    }
    if (footer) {
        embed.setFooter({ text: footer });
    }
    if (timestamp) {
        embed.setTimestamp();
    }
    return embed;
}
// ── Refresh button builder ───────────────────────────────────────────────────────
/**
 * Build a refresh button for dashboards.
 */
export function buildRefreshButton(customId, label = "🔄 Refresh") {
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary));
}
/**
 * Build action buttons for dashboard.
 */
export function buildActionButtons(buttons) {
    return new ActionRowBuilder().addComponents(buttons.map((btn) => {
        const b = new ButtonBuilder()
            .setCustomId(btn.customId)
            .setLabel(btn.label)
            .setStyle(btn.style);
        if (btn.emoji)
            b.setEmoji(btn.emoji);
        return b;
    }));
}
// ── Tab navigation builder ───────────────────────────────────────────────────────
/**
 * Build tab navigation buttons for multi-tab dashboards.
 */
export function buildTabNavigation(tabs, activeTab) {
    return new ActionRowBuilder().addComponents(tabs.map((tab) => new ButtonBuilder()
        .setCustomId(tab.id)
        .setLabel(tab.emoji ? `${tab.emoji} ${tab.label}` : tab.label)
        .setStyle(tab.id === activeTab ? ButtonStyle.Primary : ButtonStyle.Secondary)));
}
/**
 * Build dropdown menu for tab selection.
 */
export function buildTabDropdown(tabs, customId, placeholder = "Select a tab...") {
    const menu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder);
    for (const tab of tabs) {
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(tab.label)
            .setValue(tab.id);
        if (tab.emoji)
            option.setEmoji(tab.emoji);
        if (tab.description)
            option.setDescription(tab.description);
        menu.addOptions(option);
    }
    return new ActionRowBuilder().addComponents(menu);
}
// ── Empty state builder ─────────────────────────────────────────────────────────
/**
 * Build an empty state message for dashboards with no data.
 */
export function buildEmptyState(title, message, actionLabel, actionCustomId) {
    const embed = EmbedFactory.info(message, title);
    let components;
    if (actionLabel && actionCustomId) {
        components = [
            new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId(actionCustomId)
                .setLabel(actionLabel)
                .setStyle(ButtonStyle.Primary)),
        ];
    }
    return { embed, components };
}
// ── Dashboard templates ─────────────────────────────────────────────────────────
/**
 * Build an economy dashboard template.
 */
export function buildEconomyDashboard(data) {
    const { balance, dailyStreak, level, xp, xpToNext, rank } = data;
    const sections = [
        {
            title: "💰 Wallet",
            content: `${balance.toLocaleString()} coins`,
            inline: true,
        },
        {
            title: "🔥 Daily Streak",
            content: `${dailyStreak} day${dailyStreak !== 1 ? "s" : ""}`,
            inline: true,
        },
        {
            title: "⭐ Level",
            content: `Level ${level}`,
            inline: true,
        },
        {
            title: "📊 XP Progress",
            content: buildProgressSection("XP", xp, xpToNext, 15),
            inline: false,
        },
        {
            title: "🏆 Server Rank",
            content: `#${rank}`,
            inline: true,
        },
    ];
    return buildDashboard({
        title: "💎 Economy Dashboard",
        description: "Your economy stats and progress",
        color: COLORS.PRIMARY,
    }, sections);
}
/**
 * Build a moderation dashboard template.
 */
export function buildModerationDashboard(data) {
    const { casesTotal, casesToday, activeMutes, activeBans, warnings, autoModActions } = data;
    const sections = [
        {
            title: "📋 Total Cases",
            content: casesTotal.toLocaleString(),
            inline: true,
        },
        {
            title: "📅 Cases Today",
            content: casesToday.toLocaleString(),
            inline: true,
        },
        {
            title: "🔇 Active Mutes",
            content: activeMutes.toLocaleString(),
            inline: true,
        },
        {
            title: "🔨 Active Bans",
            content: activeBans.toLocaleString(),
            inline: true,
        },
        {
            title: "⚠️ Warnings",
            content: warnings.toLocaleString(),
            inline: true,
        },
        {
            title: "🤖 Auto-Mod Actions",
            content: autoModActions.toLocaleString(),
            inline: true,
        },
    ];
    return buildDashboard({
        title: "🛡️ Moderation Dashboard",
        description: "Server moderation statistics",
        color: COLORS.MODERATION,
    }, sections);
}
/**
 * Build a server stats dashboard template.
 */
export function buildServerStatsDashboard(data) {
    const { memberCount, onlineCount, messageCount, channelCount, roleCount, boostLevel } = data;
    const onlinePercent = Math.round((onlineCount / memberCount) * 100);
    const sections = [
        {
            title: "👥 Members",
            content: memberCount.toLocaleString(),
            inline: true,
        },
        {
            title: "🟢 Online",
            content: `${onlineCount.toLocaleString()} (${onlinePercent}%)`,
            inline: true,
        },
        {
            title: "💬 Messages",
            content: messageCount.toLocaleString(),
            inline: true,
        },
        {
            title: "📁 Channels",
            content: channelCount.toLocaleString(),
            inline: true,
        },
        {
            title: "🏷️ Roles",
            content: roleCount.toLocaleString(),
            inline: true,
        },
        {
            title: "✨ Boost Level",
            content: `Level ${boostLevel}`,
            inline: true,
        },
    ];
    return buildDashboard({
        title: "📊 Server Statistics",
        description: "Server overview and metrics",
        color: COLORS.INFO,
    }, sections);
}
//# sourceMappingURL=dashboard.js.map