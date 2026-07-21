/**
 * lib/retry.ts v0.2.6
 * Exponential backoff retry utility with jitter.
 * Used by database, Lavalink, and external API layers.
 *
 * Self-healing spec:
 *   Database Disconnect  → auto-reconnect + retry queue (30 s)
 *   REST Rate Limit      → smart backoff + retry (dynamic)
 *   Scheduled Job Fail   → reschedule with backoff (60 s)
 */
import { scopedLogger } from "../utils/logger.js";
import { RETRY } from "../constants/index.js";
const log = scopedLogger("retry");
/**
 * Retry `fn` with exponential backoff + jitter.
 * Throws the last error if all attempts fail.
 *
 * @example
 * const result = await withRetry(() => mongoose.connect(uri), {
 *   label: "mongodb-connect",
 *   backoffMs: RETRY.DB_BACKOFF_MS,
 * });
 */
export async function withRetry(fn, options = {}) {
    const { maxAttempts = RETRY.MAX_ATTEMPTS, backoffMs = RETRY.DB_BACKOFF_MS, jitterMs = RETRY.JITTER_MAX_MS, label = "operation", onRetry, shouldRetry, } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            if (shouldRetry && !shouldRetry(err)) {
                log.warn(`[${label}] Non-retryable error — aborting after attempt ${attempt}`, {
                    error: err instanceof Error ? err.message : String(err),
                });
                throw err;
            }
            if (attempt === maxAttempts)
                break;
            const base = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 1_000;
            const jitter = Math.floor(Math.random() * jitterMs);
            const delayMs = base + jitter;
            log.warn(`[${label}] Attempt ${attempt}/${maxAttempts} failed — retrying in ${delayMs}ms`, {
                error: err instanceof Error ? err.message : String(err),
                attempt,
                delayMs,
            });
            onRetry?.(err, attempt, delayMs);
            await sleep(delayMs);
        }
    }
    log.error(`[${label}] All ${maxAttempts} attempts failed`, {
        error: lastError instanceof Error ? lastError.message : String(lastError),
    });
    throw lastError;
}
/**
 * Retry a predicate-based poll until it returns true or timeout is reached.
 * Useful for waiting on Lavalink node availability or voice connection.
 *
 * @example
 * await waitUntil(() => isLavalinkConnected(), { timeoutMs: 10_000 });
 */
export async function waitUntil(predicate, options = {}) {
    const { timeoutMs = 30_000, pollMs = 500, label = "wait" } = options;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await predicate())
            return;
        await sleep(pollMs);
    }
    throw new Error(`[${label}] Timed out after ${timeoutMs}ms`);
}
/** Promisified setTimeout. */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Wrap a function so errors are caught and logged rather than propagated.
 * Use for fire-and-forget async tasks where failure should not crash the caller.
 */
export function safeAsync(fn, label = "safe-async") {
    fn().catch((err) => {
        log.error(`[${label}] Unhandled async error`, {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
    });
}
//# sourceMappingURL=retry.js.map