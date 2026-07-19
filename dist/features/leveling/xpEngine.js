import { UserModel } from "@/database/models/User";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed } from "@/utils/embeds";
export function xpForLevel(level) {
    return 5 * level ** 2 + 50 * level + 100;
}
export function levelForXp(xp) {
    let level = 0;
    while (xp >= xpForLevel(level)) {
        xp -= xpForLevel(level);
        level++;
    }
    return level;
}
/**
 * Awards randomized XP for a qualifying message (once per 60s per user per
 * guild by default), persists it, and announces level-ups per the guild's
 * leveling config. Skips DMs and ignored channels.
 */
export async function grantMessageXp(client, message) {
    if (!message.guildId || !message.member)
        return;
    const guildConfig = await GuildModel.findOne({ guildId: message.guildId }).lean();
    if (guildConfig?.leveling?.enabled === false)
        return;
    if (guildConfig?.leveling?.ignoredChannels?.includes(message.channelId))
        return;
    const cooldownMs = (client.config.cooldowns?.levelXpCooldownSeconds ?? 60) * 1000;
    const user = await UserModel.findOneAndUpdate({ userId: message.author.id }, { $setOnInsert: { userId: message.author.id } }, { upsert: true, new: true });
    let profile = user.guilds.find((g) => g.guildId === message.guildId);
    if (!profile) {
        user.guilds.push({ guildId: message.guildId });
        profile = user.guilds[user.guilds.length - 1];
    }
    if (profile.lastXpAt && Date.now() - new Date(profile.lastXpAt).getTime() < cooldownMs)
        return;
    const xpPerMessageMin = client.config.leveling?.xpPerMessageMin ?? 10;
    const xpPerMessageMax = client.config.leveling?.xpPerMessageMax ?? 25;
    const multiplier = guildConfig?.leveling?.xpMultiplier ?? 1;
    const gained = Math.floor((Math.random() * (xpPerMessageMax - xpPerMessageMin) + xpPerMessageMin) * multiplier);
    const previousLevel = levelForXp(profile.xp);
    profile.xp += gained;
    profile.lastXpAt = new Date();
    user.globalXp += gained;
    const newLevel = levelForXp(profile.xp);
    profile.level = newLevel;
    await user.save();
    if (newLevel > previousLevel && guildConfig?.leveling) {
        const announceMessage = (guildConfig.leveling.announceMessage ?? "🎉 GG {mention}, you've reached level **{level}**!")
            .replace("{mention}", `<@${message.author.id}>`)
            .replace("{level}", String(newLevel));
        const embed = baseEmbed("success").setDescription(announceMessage);
        const channelId = guildConfig.leveling.announceChannelId;
        const target = channelId ? message.guild?.channels.cache.get(channelId) : message.channel;
        if (target?.isTextBased())
            await target.send({ embeds: [embed] }).catch(() => { });
        const reward = guildConfig.leveling.rewards?.find((r) => r.level === newLevel);
        if (reward) {
            await message.member.roles.add(reward.roleId).catch(() => { });
        }
    }
}
//# sourceMappingURL=xpEngine.js.map