/**
 * repositories/UserRepository.ts v0.2.6
 * Repository pattern — data access for user economy and leveling profiles.
 *
 * Performance targets:
 *   Cache HIT rate > 85%
 *   Simple SELECT  < 5 ms (cache hit)
 */
import { botCache, CACHE_TTL } from "../utils/cache.js";
import { withRetry } from "../lib/retry.js";
import { DatabaseError } from "../lib/errors.js";
import { dbLog } from "../utils/logger.js";
// ── Model imports (dynamic to avoid circular imports) ─────────────────────────
async function getUserModel() {
    const { UserModel } = await import("../database/models/User.js");
    return UserModel;
}
async function getEconomyModel() {
    // Fallback to UserModel when no separate Economy model exists
    const { UserModel } = await import("../database/models/User.js");
    return UserModel;
}
// ── Cache keys ────────────────────────────────────────────────────────────────
const PROFILE_KEY = (userId, guildId) => `user:profile:${guildId}:${userId}`;
const ECONOMY_KEY = (userId, guildId) => `user:economy:${guildId}:${userId}`;
const PROFILE_TTL = CACHE_TTL.USER;
const ECONOMY_TTL = CACHE_TTL.USER;
// ── Repository ────────────────────────────────────────────────────────────────
export const UserRepository = {
    /**
     * Get or create a user profile for leveling data.
     */
    async getProfile(userId, guildId) {
        const key = PROFILE_KEY(userId, guildId);
        const cached = botCache.get(key);
        if (cached)
            return cached;
        const t0 = Date.now();
        const Model = await getUserModel();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let doc = await withRetry(() => Model.findOne({ userId, guildId }).lean().exec(), { label: `user-profile:${userId}` });
        if (!doc) {
            doc = await withRetry(() => Model.findOneAndUpdate({ userId, guildId }, { $setOnInsert: { userId, guildId, xp: 0, level: 0, balance: 500, bank: 0 } }, { new: true, upsert: true, lean: true }).exec(), { label: `user-upsert:${userId}` });
        }
        if (!doc)
            throw new DatabaseError(`Failed to get/create user ${userId}`, "getProfile");
        const dto = {
            userId,
            guildId,
            xp: doc.xp ?? 0,
            level: doc.level ?? 0,
            rank: 0, // filled by getRank() separately
            balance: doc.balance ?? 500,
            bank: doc.bank ?? 0,
            totalMessages: doc.totalMessages ?? 0,
            joinedAt: doc.createdAt ?? new Date(),
        };
        botCache.set(key, dto, PROFILE_TTL);
        dbLog.debug("UserRepository.getProfile", { userId, guildId, ms: Date.now() - t0 });
        return dto;
    },
    /**
     * Add XP to a user. Returns the updated profile with new level info.
     */
    async addXp(userId, guildId, amount) {
        const Model = await getUserModel();
        const before = await UserRepository.getProfile(userId, guildId);
        const oldLevel = before.level;
        const doc = await withRetry(() => Model.findOneAndUpdate({ userId, guildId }, { $inc: { xp: amount, totalMessages: 1 } }, { new: true, upsert: true, lean: true }).exec(), { label: `xp-add:${userId}` });
        if (!doc)
            throw new DatabaseError(`Failed to add XP for ${userId}`, "addXp");
        // Recalculate level
        const xp = doc.xp ?? 0;
        const newLevel = computeLevel(xp);
        const leveledUp = newLevel > oldLevel;
        if (newLevel !== oldLevel) {
            await withRetry(() => Model.updateOne({ userId, guildId }, { $set: { level: newLevel } }).exec(), { label: `level-set:${userId}` });
        }
        botCache.delete(PROFILE_KEY(userId, guildId));
        return { xp, level: newLevel, leveledUp, oldLevel };
    },
    /**
     * Update a user's balance (economy).
     */
    async updateBalance(userId, guildId, delta) {
        const Model = await getEconomyModel();
        const doc = await withRetry(() => Model.findOneAndUpdate({ userId, guildId }, { $inc: { balance: delta } }, { new: true, upsert: true, lean: true }).exec(), { label: `balance-update:${userId}` });
        if (!doc)
            throw new DatabaseError(`Failed to update balance for ${userId}`, "updateBalance");
        botCache.delete(ECONOMY_KEY(userId, guildId));
        return doc.balance ?? 0;
    },
    /**
     * Invalidate all caches for a user.
     */
    invalidateCache(userId, guildId) {
        botCache.delete(PROFILE_KEY(userId, guildId));
        botCache.delete(ECONOMY_KEY(userId, guildId));
    },
};
// ── Utility ───────────────────────────────────────────────────────────────────
/** XP formula: 5N² + 50N + 100 */
function xpForLevel(level) {
    return 5 * level ** 2 + 50 * level + 100;
}
/** Compute current level from total XP. */
function computeLevel(xp) {
    let level = 0;
    let cumulative = 0;
    while (cumulative + xpForLevel(level) <= xp) {
        cumulative += xpForLevel(level);
        level++;
    }
    return level;
}
//# sourceMappingURL=UserRepository.js.map