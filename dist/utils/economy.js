/**
 * Shared economy helpers for guild-scoped balance operations.
 * The UserModel stores balance inside guilds[].balance (nested).
 * These helpers use the positional operator to update correctly.
 */
import { UserModel } from "../database/models/User.js";
export async function getGuildBalance(userId, guildId) {
    const doc = await UserModel.findOne({ userId }).lean();
    return doc?.guilds?.find((g) => g.guildId === guildId)?.balance ?? 0;
}
/**
 * Add (or subtract) coins from a guild profile.
 * Creates the guild profile if it doesn't exist yet.
 */
export async function addGuildBalance(userId, guildId, delta) {
    const result = await UserModel.updateOne({ userId, "guilds.guildId": guildId }, { $inc: { "guilds.$.balance": delta } });
    if (result.matchedCount === 0) {
        // Profile doesn't exist — create user doc (or push profile)
        await UserModel.updateOne({ userId }, { $push: { guilds: { guildId, balance: Math.max(0, delta) } } }, { upsert: true });
    }
}
/**
 * Increment gambling stats on the guild profile.
 */
export async function recordGamblingResult(userId, guildId, opts) {
    const inc = {
        "guilds.$.totalGambled": opts.wagered,
    };
    if (opts.won) {
        inc["guilds.$.gamesWon"] = 1;
        inc["guilds.$.totalGambledWon"] = opts.payout;
    }
    if (opts.lost)
        inc["guilds.$.gamesLost"] = 1;
    if (opts.tied)
        inc["guilds.$.gamesTied"] = 1;
    await UserModel.updateOne({ userId, "guilds.guildId": guildId }, { $inc: inc }).catch(() => { });
}
//# sourceMappingURL=economy.js.map