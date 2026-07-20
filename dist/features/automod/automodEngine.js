import { GuildModel } from "../../database/models/Guild.js";
import { warnEmbed } from "../../utils/embeds.js";
import { createModCase } from "../moderation/caseEngine.js";
const INVITE_REGEX = /(discord\.gg|discord(app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;
const LINK_REGEX = /(https?:\/\/)[^\s]+/gi;
const recentMessages = new Map(); // `${guildId}:${userId}` -> timestamps, for spam/flood detection
function isWhitelisted(config, message) {
    if (config.automod.whitelistUsers?.includes(message.author.id))
        return true;
    if (message.member?.roles.cache.some((r) => config.automod.whitelistRoles?.includes(r.id)))
        return true;
    if (config.automod.whitelistChannels?.includes(message.channelId))
        return true;
    return false;
}
/**
 * Runs the configured automod checks against a message in order of
 * cheapest-first. Returns `true` if the message was deleted / the pipeline
 * should stop further processing (e.g. XP grant) for this message.
 */
export async function runAutomodChecks(client, message) {
    if (!message.guildId || !message.member || message.member.permissions.has("Administrator"))
        return false;
    const config = await GuildModel.findOne({ guildId: message.guildId }).lean();
    if (!config?.automod?.enabled)
        return false;
    if (isWhitelisted(config, message))
        return false;
    const { automod } = config;
    if (automod.antiInvite && INVITE_REGEX.test(message.content)) {
        await violate(client, message, "Posting Discord invite links is not allowed here.");
        return true;
    }
    if (automod.antiLink) {
        const links = message.content.match(LINK_REGEX) ?? [];
        const allowed = links.every((link) => automod.linkWhitelistDomains?.some((d) => link.includes(d)));
        if (links.length && !allowed) {
            await violate(client, message, "Posting links is not allowed here.");
            return true;
        }
    }
    if (automod.antiMentionLimit > 0 && message.mentions.users.size > automod.antiMentionLimit) {
        await violate(client, message, `Mentioning more than ${automod.antiMentionLimit} users at once is not allowed.`);
        return true;
    }
    if (automod.badWords?.length) {
        const lower = message.content.toLowerCase();
        if (automod.badWords.some((w) => lower.includes(w.toLowerCase()))) {
            await violate(client, message, "That message contained a blocked word.");
            return true;
        }
    }
    if (automod.antiSpam || automod.antiFlood) {
        const key = `${message.guildId}:${message.author.id}`;
        const now = Date.now();
        const windowMs = 7000;
        const timestamps = (recentMessages.get(key) ?? []).filter((t) => now - t < windowMs);
        timestamps.push(now);
        recentMessages.set(key, timestamps);
        const limit = automod.antiFlood ? 6 : 5;
        if (timestamps.length > limit) {
            await violate(client, message, "You're sending messages too quickly. Please slow down.");
            recentMessages.set(key, []);
            return true;
        }
    }
    if (automod.antiBot && message.author.bot) {
        await message.delete().catch(() => { });
        return true;
    }
    return false;
}
async function violate(client, message, reason) {
    await message.delete().catch(() => { });
    const warning = await message.channel
        .send({ embeds: [warnEmbed(`${message.author}, ${reason}`)] })
        .catch(() => null);
    setTimeout(() => warning?.delete().catch(() => { }), 6000);
    await createModCase({
        guildId: message.guildId,
        userId: message.author.id,
        moderatorId: client.user.id,
        type: "warn",
        reason: `[Automod] ${reason}`,
    });
}
//# sourceMappingURL=automodEngine.js.map