import { ModCaseModel } from "@/database/models/Moderation";
import { GuildModel } from "@/database/models/Guild";
/**
 * Creates a new, guild-scoped, auto-incrementing moderation case. Case IDs
 * are per-guild (case #1, #2, ... per server) which is what moderators
 * expect when referencing `modlogs`/`case` commands.
 */
export async function createModCase(input) {
    const guild = await GuildModel.findOneAndUpdate({ guildId: input.guildId }, { $setOnInsert: { guildId: input.guildId } }, { upsert: true, new: true });
    const lastCase = await ModCaseModel.findOne({ guildId: input.guildId }).sort({ caseId: -1 }).lean();
    const caseId = (lastCase?.caseId ?? 0) + 1;
    const expiresAt = input.expiresAt ?? (input.duration ? new Date(Date.now() + input.duration) : null);
    return ModCaseModel.create({
        caseId,
        guildId: input.guildId,
        userId: input.userId,
        moderatorId: input.moderatorId,
        type: input.type,
        reason: input.reason ?? "No reason provided",
        duration: input.duration ?? null,
        expiresAt,
    });
}
export async function getActiveWarningCount(guildId, userId) {
    return ModCaseModel.countDocuments({ guildId, userId, type: "warn", active: true });
}
//# sourceMappingURL=caseEngine.js.map