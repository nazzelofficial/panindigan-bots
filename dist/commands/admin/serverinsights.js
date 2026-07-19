import { PermissionFlagsBits } from "discord.js";
import { ModCaseModel } from "../../database/models/Moderation";
import { UserModel } from "../../database/models/User";
import { GiveawayModel } from "../../database/models/Community";
import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "serverinsights",
    description: "View detailed statistics and insights about your server",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 30,
    aliases: ["serverstats2", "insights", "guildstats"],
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        // Fetch members if not cached
        if (guild.memberCount > guild.members.cache.size) {
            await guild.members.fetch().catch(() => { });
        }
        const members = guild.members.cache;
        const totalMembers = guild.memberCount;
        const bots = members.filter((m) => m.user.bot).size;
        const humans = totalMembers - bots;
        const online = members.filter((m) => m.presence?.status !== "offline" && m.presence !== null).size;
        const boosters = guild.premiumSubscriptionCount ?? 0;
        // Channel breakdown
        const channels = guild.channels.cache;
        const textChannels = channels.filter((c) => c.isTextBased() && !c.isThread() && !c.isDMBased()).size;
        const voiceChannels = channels.filter((c) => c.isVoiceBased()).size;
        const categories = channels.filter((c) => c.type === 4).size;
        const threads = channels.filter((c) => c.isThread()).size;
        // 30-day mod stats
        const since30d = new Date(Date.now() - 30 * 86_400_000);
        const [modCases30d, activeGiveaways, memberXpCount] = await Promise.all([
            ModCaseModel.countDocuments({ guildId: guild.id, createdAt: { $gte: since30d } }),
            GiveawayModel.countDocuments({ guildId: guild.id, ended: false }),
            UserModel.countDocuments({ guildId: guild.id }),
        ]);
        const createdAt = guild.createdAt;
        const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
        const embed = baseEmbed("primary")
            .setTitle(`📊 Server Insights — ${guild.name}`)
            .setThumbnail(guild.iconURL() ?? null)
            .addFields({
            name: "👥 Members",
            value: [
                `Total: **${totalMembers.toLocaleString()}**`,
                `Humans: **${humans.toLocaleString()}**`,
                `Bots: **${bots}**`,
                `Online: **${online}**`,
                `Boosters: **${boosters}** (Level ${guild.premiumTier})`,
            ].join("\n"),
            inline: true,
        }, {
            name: "📣 Channels",
            value: [
                `Text: **${textChannels}**`,
                `Voice: **${voiceChannels}**`,
                `Categories: **${categories}**`,
                `Threads: **${threads}**`,
            ].join("\n"),
            inline: true,
        }, {
            name: "📋 Content",
            value: [
                `Roles: **${guild.roles.cache.size}**`,
                `Emojis: **${guild.emojis.cache.size}**`,
                `Stickers: **${guild.stickers.cache.size}**`,
            ].join("\n"),
            inline: true,
        }, {
            name: "🔨 Moderation (30d)",
            value: `Cases logged: **${modCases30d}**`,
            inline: true,
        }, {
            name: "🎉 Economy",
            value: [
                `XP profiles: **${memberXpCount}**`,
                `Active giveaways: **${activeGiveaways}**`,
            ].join("\n"),
            inline: true,
        }, {
            name: "🗓️ Server Age",
            value: `Created <t:${Math.floor(createdAt.getTime() / 1000)}:D>\n${ageDays.toLocaleString()} days old`,
            inline: true,
        })
            .setFooter({ text: `ID: ${guild.id} · Region: ${guild.preferredLocale}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=serverinsights.js.map