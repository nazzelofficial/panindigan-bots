/**
 * builders/PaginatorBuilder.ts v0.2.6
 * Smart Paginator — memory-aware paginated embed views.
 *
 * v0.2.6 Micro UX spec:
 *   🧠 Pagination Memory   — returns to last viewed page
 *   🔍 Search Memory       — remembers last search query
 *   📖 Context-Aware Help  — relevant tips based on current page
 *   📏 Field Resizing      — auto-adjusts field widths
 *   ✂️ Intelligent Truncation — graceful truncation
 *   📃 Smart Splitting     — large content split into pages
 *   📊 Auto-Pagination     — large lists get built-in paginator
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } from "discord.js";
import { EmbedFactory } from "../structures/EmbedFactory.js";
import { PAGINATION, CUSTOM_ID } from "../constants/index.js";
import { truncateField, truncateDescription } from "../validators/InputValidator.js";
import { collectorManager } from "../managers/CollectorManager.js";
import { scopedLogger } from "../utils/logger.js";
const log = scopedLogger("paginator");
// ── Builder ────────────────────────────────────────────────────────────────────
export class PaginatorBuilder {
    opts;
    currentPage;
    constructor(options) {
        this.opts = {
            pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
            pageTip: () => "",
            guildId: null,
            shardId: undefined,
            initialPage: 1,
            timeoutMs: PAGINATION.COLLECTOR_TIMEOUT_MS,
            color: "primary",
            ...options,
        };
        this.currentPage = Math.max(1, this.opts.initialPage);
    }
    get totalPages() {
        return Math.max(1, Math.ceil(this.opts.items.length / this.opts.pageSize));
    }
    get totalItems() {
        return this.opts.items.length;
    }
    /** Get the items for the current page. */
    pageItems() {
        const { items, pageSize } = this.opts;
        const start = (this.currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }
    /** Build the embed for the current page. */
    buildEmbed() {
        const { title, formatPage, pageTip, shardId, color } = this.opts;
        const items = this.pageItems();
        const desc = truncateDescription(formatPage(items, this.currentPage, this.totalPages));
        const tip = pageTip(this.currentPage, this.totalPages);
        const shardStr = shardId !== undefined ? ` | Shard ${shardId}` : "";
        const footer = `Page ${this.currentPage} / ${this.totalPages}${tip ? ` • ${tip}` : ""}  •  Panindigan v0.2.6${shardStr}`;
        return EmbedFactory.base(color)
            .setTitle(title)
            .setDescription(desc)
            .setFooter({ text: footer, iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" });
    }
    /** Build the navigation button row. */
    buildControls() {
        const atFirst = this.currentPage === 1;
        const atLast = this.currentPage === this.totalPages;
        const first = new ButtonBuilder()
            .setCustomId(CUSTOM_ID.PAGINATOR_FIRST)
            .setEmoji("⏮")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(atFirst);
        const prev = new ButtonBuilder()
            .setCustomId(CUSTOM_ID.PAGINATOR_PREV)
            .setEmoji("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(atFirst);
        const pageBtn = new ButtonBuilder()
            .setCustomId("pag:label")
            .setLabel(`${this.currentPage} / ${this.totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        const next = new ButtonBuilder()
            .setCustomId(CUSTOM_ID.PAGINATOR_NEXT)
            .setEmoji("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(atLast);
        const last = new ButtonBuilder()
            .setCustomId(CUSTOM_ID.PAGINATOR_LAST)
            .setEmoji("⏭")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(atLast);
        return new ActionRowBuilder().addComponents(first, prev, pageBtn, next, last);
    }
    /** Build the full page payload ready to send/edit a message. */
    build() {
        return {
            embed: this.buildEmbed(),
            components: this.totalPages > 1 ? [this.buildControls()] : [],
            currentPage: this.currentPage,
            totalPages: this.totalPages,
        };
    }
    /** Set page and return new page payload. */
    goTo(page) {
        this.currentPage = Math.min(Math.max(1, page), this.totalPages);
        return this.build();
    }
    next() { return this.goTo(this.currentPage + 1); }
    prev() { return this.goTo(this.currentPage - 1); }
    first() { return this.goTo(1); }
    last() { return this.goTo(this.totalPages); }
    /**
     * Send the paginator to a message and start the button collector.
     * State (current page) is persisted via CollectorManager.
     */
    async send(message) {
        if (this.totalPages <= 1)
            return;
        const { userId, guildId, timeoutMs } = this.opts;
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.user.id === userId,
            time: timeoutMs,
        });
        collectorManager.register({
            id: `${message.id}:${userId}`,
            messageId: message.id,
            userId,
            guildId: guildId ?? null,
            type: "paginator",
            state: { currentPage: this.currentPage, totalPages: this.totalPages },
            collector,
        });
        collector.on("collect", async (i) => {
            await i.deferUpdate();
            let page;
            switch (i.customId) {
                case CUSTOM_ID.PAGINATOR_FIRST:
                    page = this.first();
                    break;
                case CUSTOM_ID.PAGINATOR_PREV:
                    page = this.prev();
                    break;
                case CUSTOM_ID.PAGINATOR_NEXT:
                    page = this.next();
                    break;
                case CUSTOM_ID.PAGINATOR_LAST:
                    page = this.last();
                    break;
                default: return;
            }
            collectorManager.updateState(message.id, userId, { currentPage: page.currentPage });
            await i.editReply({ embeds: [page.embed], components: page.components });
        });
        collector.on("end", () => {
            // Disable all buttons when collector expires
            const disabledRow = this.buildControls();
            disabledRow.components.forEach((b) => b.setDisabled(true));
            message.edit({ components: [disabledRow] }).catch(() => null);
            log.debug("Paginator collector ended", { messageId: message.id, userId });
        });
    }
}
// ── Quick factory ─────────────────────────────────────────────────────────────
/**
 * Create a paginated embed from a simple string array.
 * Each item is displayed as one line.
 */
export function paginateStrings(lines, opts) {
    return new PaginatorBuilder({
        ...opts,
        items: lines,
        formatPage: (items) => items.map((l, i) => {
            const num = ((opts.initialPage ?? 1) - 1) * (opts.pageSize ?? 10) + i + 1;
            return `\`${String(num).padStart(2)}\` ${truncateField(l, 80)}`;
        }).join("\n"),
    });
}
//# sourceMappingURL=PaginatorBuilder.js.map