/**
 * RateLimitStore — in-memory sliding-window rate limiter.
 *
 * Applied globally in the interaction handler before any cooldown checks.
 * Defaults: 10 interactions per user per 10 seconds (configurable).
 *
 * Uses a simple token-bucket-style deque: we store timestamps of recent
 * hits and count how many fall within the window.
 */
export class RateLimitStore {
    maxHits;
    windowMs;
    /** userId → sorted array of hit timestamps (oldest first). */
    buckets = new Map();
    constructor(options = {}) {
        this.maxHits = options.maxHits ?? 10;
        this.windowMs = options.windowMs ?? 10_000;
    }
    /**
     * Record a hit for `userId` and return whether they are currently
     * rate-limited.
     */
    hit(userId) {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        let timestamps = this.buckets.get(userId) ?? [];
        // Prune hits that have slid out of the window
        timestamps = timestamps.filter((t) => t > cutoff);
        const hits = timestamps.length;
        if (hits >= this.maxHits) {
            // Time until the oldest hit slides out of the window
            const oldest = timestamps[0];
            const retryAfterMs = oldest + this.windowMs - now;
            this.buckets.set(userId, timestamps);
            return { limited: true, retryAfterMs, hits };
        }
        timestamps.push(now);
        this.buckets.set(userId, timestamps);
        return { limited: false, retryAfterMs: 0, hits: timestamps.length };
    }
    /**
     * Inspect without recording a hit.  Useful for checking before a deferred
     * reply is attempted.
     */
    check(userId) {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        const timestamps = (this.buckets.get(userId) ?? []).filter((t) => t > cutoff);
        const hits = timestamps.length;
        if (hits >= this.maxHits) {
            const oldest = timestamps[0];
            const retryAfterMs = oldest + this.windowMs - now;
            return { limited: true, retryAfterMs, hits };
        }
        return { limited: false, retryAfterMs: 0, hits };
    }
    /** Remove stale buckets to prevent unbounded memory growth. */
    prune() {
        const cutoff = Date.now() - this.windowMs;
        let pruned = 0;
        for (const [userId, timestamps] of this.buckets) {
            const fresh = timestamps.filter((t) => t > cutoff);
            if (fresh.length === 0) {
                this.buckets.delete(userId);
                pruned++;
            }
            else {
                this.buckets.set(userId, fresh);
            }
        }
        return pruned;
    }
    /** Current number of tracked users (for monitoring). */
    get size() {
        return this.buckets.size;
    }
}
/** Shared global rate limiter — 10 interactions per user per 10 seconds. */
export const globalRateLimit = new RateLimitStore({ maxHits: 10, windowMs: 10_000 });
// Prune stale entries every 5 minutes to prevent memory leaks.
setInterval(() => globalRateLimit.prune(), 5 * 60_000).unref();
//# sourceMappingURL=RateLimitStore.js.map