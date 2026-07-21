/**
 * utils/recovery.ts v0.2.6
 * Auto-Recovery System — graceful failure handling and automatic recovery
 *
 * v0.2.6 Recovery Patterns:
 *   🔌 Discord Gateway disconnect → exponential backoff reconnect
 *   🗄️ Database disconnect → connection pool auto-reconnect
 *   🎵 Lavalink node down → failover to backup node
 *   🔴 Redis disconnect → graceful degradation to in-memory
 *   🤖 AI provider timeout → failover to backup provider
 *   💥 Unexpected runtime error → log, recover, continue
 *
 * All recovery actions are logged and include context for debugging.
 */
import { scopedLogger } from "./logger.js";
import { RETRY } from "../constants/index.js";
const log = scopedLogger("recovery");
const recoveryState = new Map();
// ── Exponential backoff with jitter ───────────────────────────────────────────────
/**
 * Calculate delay with exponential backoff and jitter.
 * Prevents thundering herd problem when multiple instances retry simultaneously.
 */
export function calculateBackoff(attempt, baseDelays = RETRY.DB_BACKOFF_MS) {
    const index = Math.min(attempt - 1, baseDelays.length - 1);
    const baseDelay = baseDelays[index] ?? baseDelays[baseDelays.length - 1];
    const jitter = Math.random() * RETRY.JITTER_MAX_MS;
    return baseDelay + jitter;
}
// ── Recovery orchestrator ─────────────────────────────────────────────────────────
/**
 * Execute a function with automatic retry on failure.
 * Uses exponential backoff and tracks recovery state.
 */
export async function withRecovery(key, fn, options = {}) {
    const { maxAttempts = RETRY.MAX_ATTEMPTS, baseDelays = RETRY.DB_BACKOFF_MS, onRetry, onFailure, } = options;
    const state = recoveryState.get(key) ?? {
        attempt: 0,
        lastAttempt: 0,
        nextAttempt: 0,
        errors: [],
    };
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            state.attempt = attempt;
            state.lastAttempt = Date.now();
            const result = await fn();
            // Success - clear recovery state
            recoveryState.delete(key);
            log.info(`Recovery successful for ${key}`, { attempt });
            return result;
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            state.errors.push(lastError);
            if (attempt < maxAttempts) {
                const delay = calculateBackoff(attempt, baseDelays);
                state.nextAttempt = Date.now() + delay;
                recoveryState.set(key, state);
                log.warn(`Recovery attempt ${attempt}/${maxAttempts} failed for ${key}, retrying in ${Math.round(delay)}ms`, {
                    error: lastError.message,
                    attempt,
                    delay,
                });
                onRetry?.(attempt, lastError);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    // All attempts failed
    recoveryState.delete(key);
    log.error(`Recovery failed for ${key} after ${maxAttempts} attempts`, {
        errors: state.errors.map((e) => e.message),
    });
    onFailure?.(lastError);
    throw lastError;
}
/**
 * Get current recovery state for a key.
 */
export function getRecoveryState(key) {
    return recoveryState.get(key);
}
/**
 * Clear recovery state for a key.
 */
export function clearRecoveryState(key) {
    recoveryState.delete(key);
}
const circuitBreakers = new Map();
/**
 * Execute a function with circuit breaker protection.
 * Opens circuit after threshold failures, preventing cascading failures.
 */
export async function withCircuitBreaker(key, fn, options = {
    failureThreshold: 5,
    resetTimeoutMs: 60_000,
}) {
    const { failureThreshold, resetTimeoutMs } = options;
    const state = circuitBreakers.get(key) ?? {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
    };
    const now = Date.now();
    // Check if circuit should reset
    if (state.isOpen && now >= state.nextAttemptTime) {
        state.isOpen = false;
        state.failureCount = 0;
        log.info(`Circuit breaker reset for ${key}`);
    }
    // Reject if circuit is open
    if (state.isOpen) {
        const waitTime = Math.round((state.nextAttemptTime - now) / 1000);
        throw new Error(`Circuit breaker open for ${key}. Retry in ${waitTime}s`);
    }
    try {
        const result = await fn();
        // Success - reset failure count
        state.failureCount = 0;
        circuitBreakers.set(key, state);
        return result;
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        state.failureCount++;
        state.lastFailureTime = now;
        // Open circuit if threshold reached
        if (state.failureCount >= failureThreshold) {
            state.isOpen = true;
            state.nextAttemptTime = now + resetTimeoutMs;
            log.error(`Circuit breaker opened for ${key}`, {
                failureCount: state.failureCount,
                threshold: failureThreshold,
            });
        }
        circuitBreakers.set(key, state);
        throw error;
    }
}
/**
 * Manually open a circuit breaker.
 */
export function openCircuitBreaker(key, resetTimeoutMs = 60_000) {
    circuitBreakers.set(key, {
        isOpen: true,
        failureCount: 1,
        lastFailureTime: Date.now(),
        nextAttemptTime: Date.now() + resetTimeoutMs,
    });
    log.warn(`Circuit breaker manually opened for ${key}`);
}
/**
 * Manually close a circuit breaker.
 */
export function closeCircuitBreaker(key) {
    circuitBreakers.delete(key);
    log.info(`Circuit breaker manually closed for ${key}`);
}
const degradationState = {
    level: "full",
    reason: "normal",
    since: Date.now(),
};
/**
 * Set the current degradation level.
 * Affects which features are available during outages.
 */
export function setDegradationLevel(level, reason) {
    degradationState.level = level;
    degradationState.reason = reason;
    degradationState.since = Date.now();
    log.warn(`Degradation level set to ${level}`, { reason });
}
/**
 * Get current degradation level.
 */
export function getDegradationLevel() {
    return { ...degradationState };
}
/**
 * Check if a feature is available at current degradation level.
 */
export function isFeatureAvailable(feature) {
    const { level } = degradationState;
    switch (level) {
        case "full":
            return true;
        case "partial":
            // Only core features during partial degradation
            return feature === "general" || feature === "moderation";
        case "minimal":
            // Only essential features during minimal degradation
            return feature === "general";
        default:
            return true;
    }
}
/**
 * Execute a health check with timeout.
 */
export async function withHealthCheck(name, check, timeoutMs = 5000) {
    const start = Date.now();
    try {
        const result = await Promise.race([
            check(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Health check timeout")), timeoutMs)),
        ]);
        const latency = Date.now() - start;
        log.debug(`Health check passed for ${name}`, { latency, healthy: result.healthy });
        return {
            ...result,
            latency,
        };
    }
    catch (err) {
        const latency = Date.now() - start;
        const error = err instanceof Error ? err : new Error(String(err));
        log.error(`Health check failed for ${name}`, { error: error.message, latency });
        return {
            healthy: false,
            message: error.message,
            latency,
            details: { error: error.message },
        };
    }
}
//# sourceMappingURL=recovery.js.map