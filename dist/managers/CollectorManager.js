/**
 * managers/CollectorManager.ts v0.2.6
 * Stateful collector manager — tracks all active Discord collectors with
 * automatic cleanup, timeout recovery, and state restore on restart.
 *
 * v0.2.6 Self-Healing spec:
 *   Collector Timeout → Restart with state restore (Immediate)
 *
 * v0.2.6 Micro UX spec:
 *   🧠 Pagination Memory  — returns to last viewed page
 *   🔍 Search Memory      — remembers last search query
 *   🎛️ Filter Persistence — filters persist after actions
 */
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, } from "discord.js";
import { scopedLogger } from "../utils/logger.js";
import { TIMING } from "../constants/index.js";
const log = scopedLogger("collector-manager");
// ── Manager ───────────────────────────────────────────────────────────────────
export class CollectorManager {
    records = new Map();
    pruneInterval = null;
    constructor() {
        // Prune expired collectors every 60 s
        this.pruneInterval = setInterval(() => this.prune(), 60_000).unref();
    }
    /**
     * Register a new collector with its state.
     * If a collector already exists for this message+user, it is stopped first.
     */
    register(record) {
        const { timeoutMs = TIMING.COLLECTOR_MAX_MS, ...rest } = record;
        const id = this.key(record.messageId, record.userId);
        // Stop any existing collector for the same message+user
        this.stop(id);
        const now = new Date();
        this.records.set(id, {
            ...rest,
            createdAt: now,
            expiresAt: new Date(now.getTime() + timeoutMs),
        });
        log.debug("Collector registered", {
            id,
            type: record.type,
            userId: record.userId,
            guildId: record.guildId,
            timeoutMs,
        });
    }
    /**
     * Retrieve the current state for a message+user pair.
     * Used by paginator callbacks to restore page, query, and filter state.
     */
    getState(messageId, userId) {
        const record = this.records.get(this.key(messageId, userId));
        if (!record)
            return null;
        if (Date.now() > record.expiresAt.getTime()) {
            this.records.delete(this.key(messageId, userId));
            return null;
        }
        return record.state;
    }
    /**
     * Update state fields for a running collector.
     * Partial — only the provided keys are overwritten.
     */
    updateState(messageId, userId, patch) {
        const id = this.key(messageId, userId);
        const record = this.records.get(id);
        if (!record)
            return;
        record.state = { ...record.state, ...patch };
    }
    /** Stop and deregister a collector. */
    stop(id) {
        const record = this.records.get(id);
        if (!record)
            return;
        try {
            record.collector?.stop?.("manager_stop");
        }
        catch {
            // Collector may already be ended
        }
        this.records.delete(id);
        log.debug("Collector stopped", { id });
    }
    /** Stop all collectors for a given guild (e.g. on guild leave). */
    stopGuild(guildId) {
        let count = 0;
        for (const [id, record] of this.records) {
            if (record.guildId === guildId) {
                this.stop(id);
                count++;
            }
        }
        return count;
    }
    /** Returns current active collector count. */
    get size() {
        return this.records.size;
    }
    /** Returns a snapshot of all active collector metadata (without the collector instance). */
    snapshot() {
        return [...this.records.values()].map(({ collector: _c, ...rest }) => rest);
    }
    /** Remove expired collectors. Called on interval and can be called manually. */
    prune() {
        const now = Date.now();
        let pruned = 0;
        for (const [id, record] of this.records) {
            if (now > record.expiresAt.getTime()) {
                this.stop(id);
                pruned++;
            }
        }
        if (pruned > 0)
            log.debug(`Pruned ${pruned} expired collectors`, { remaining: this.records.size });
        return pruned;
    }
    /** Shutdown: stop all collectors and clear the prune interval. */
    destroy() {
        if (this.pruneInterval) {
            clearInterval(this.pruneInterval);
            this.pruneInterval = null;
        }
        for (const id of this.records.keys())
            this.stop(id);
        log.info("CollectorManager destroyed");
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    key(messageId, userId) {
        return `${messageId}:${userId}`;
    }
}
// ── Singleton ─────────────────────────────────────────────────────────────────
export const collectorManager = new CollectorManager();
// ── Pagination helper ─────────────────────────────────────────────────────────
/**
 * Build disabled pagination button rows for use while an action is processing.
 * Satisfies the v0.2.6 Button Layer — Loading States spec.
 */
export function buildDisabledPaginatorRow(currentPage, totalPages) {
    const prev = new ButtonBuilder()
        .setCustomId("pag:prev")
        .setEmoji("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    const pageLabel = new ButtonBuilder()
        .setCustomId("pag:label")
        .setLabel(`${currentPage} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    const next = new ButtonBuilder()
        .setCustomId("pag:next")
        .setEmoji("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);
    return new ActionRowBuilder().addComponents(prev, pageLabel, next);
}
//# sourceMappingURL=CollectorManager.js.map