/**
 * Simple in-memory cache with TTL support.
 * Used by hot paths (e.g. GuildModel lookups in dispatchCommand) to reduce DB load.
 */
class TTLCache {
    store = new Map();
    set(key, value, ttlMs) {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    delete(key) {
        return this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
    clearPattern(pattern) {
        let count = 0;
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) {
                this.store.delete(key);
                count++;
            }
        }
        return count;
    }
    stats() {
        // Prune expired first
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt)
                this.store.delete(key);
        }
        return { size: this.store.size, keys: [...this.store.keys()] };
    }
    getEntry(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        const ttlRemaining = entry.expiresAt - Date.now();
        if (ttlRemaining <= 0) {
            this.store.delete(key);
            return null;
        }
        return { value: entry.value, ttlRemaining };
    }
}
export const botCache = new TTLCache();
/** Cache TTL constants (ms) */
export const CACHE_TTL = {
    GUILD_CONFIG: 60_000, // 1 minute
    PREMIUM: 120_000, // 2 minutes
    USER: 30_000, // 30 seconds
    COMMANDS: 300_000, // 5 minutes
};
//# sourceMappingURL=cache.js.map