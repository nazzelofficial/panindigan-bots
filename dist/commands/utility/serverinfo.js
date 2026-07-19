import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "serverinfo",
    description: "View detailed information about this server",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["si", "guildinfo", "server"],
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await guild.fetch();
        const owner = await guild.fetchOwner().catch(() => null);
        const createdAt = Math.floor(guild.createdTimestamp / 1000);
        const textChannels = guild.channels.cache.filter((c) => c.isTextBased()).size;
        const voiceChannels = guild.channels.cache.filter((c) => c.isVoiceBased?.() ?? false).size;
        const boostTier = ["None", "Tier 1", "Tier 2", "Tier 3"][guild.premiumTier] ?? "Unknown";
        const embed = baseEmbed("primary")
            .setTitle(`🏠 ${guild.name}`)
            .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
            .setImage(guild.bannerURL({ size: 1024 }) ?? null)
            .addFields({ name: "🆔 Server ID", value: guild.id, inline: true }, { name: "👑 Owner", value: owner ? `${owner.user.username} (${owner.id})` : guild.ownerId, inline: true }, { name: "📅 Created", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: false }, { name: "👥 Members", value: guild.memberCount.toString(), inline: true }, { name: "💬 Text Channels", value: textChannels.toString(), inline: true }, { name: "🔊 Voice Channels", value: voiceChannels.toString(), inline: true }, { name: "🎭 Roles", value: guild.roles.cache.size.toString(), inline: true }, { name: "😀 Emojis", value: guild.emojis.cache.size.toString(), inline: true }, { name: "🏋️ Stickers", value: guild.stickers.cache.size.toString(), inline: true }, { name: "🚀 Boost Level", value: boostTier, inline: true }, { name: "💎 Boost Count", value: guild.premiumSubscriptionCount?.toString() ?? "0", inline: true }, { name: "✅ Verification Level", value: ["None", "Low", "Medium", "High", "Very High"][guild.verificationLevel] ?? "Unknown", inline: true })
            .setFooter({ text: `Locale: ${guild.preferredLocale}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=serverinfo.js.map