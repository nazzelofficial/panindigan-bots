import { GuildModel } from "../../database/models/Guild.js";
import { PremiumModel } from "../../database/models/Premium.js";
import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "config",
    description: "View the full configuration export for this server",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    cooldown: 15,
    aliases: ["serverconfig", "guildconfig"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const [cfg, premium] = await Promise.all([
            GuildModel.findOne({ guildId: guild.id }).lean(),
            PremiumModel.findOne({ guildId: guild.id }).lean(),
        ]);
        const doc = cfg;
        const embed = baseEmbed("primary")
            .setTitle(`⚙️ Server Config — ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields({ name: "Premium", value: premium?.tier && premium.tier !== "none" ? `⭐ ${premium.tier.toUpperCase()}` : "Free", inline: true }, { name: "Prefix", value: doc?.prefix ? `\`${doc.prefix}\`` : "Default", inline: true }, { name: "Language", value: doc?.language ?? "en", inline: true }, { name: "Welcome", value: doc?.welcome?.enabled ? `✅ <#${doc.welcome.channelId}>` : "❌", inline: true }, { name: "Goodbye", value: doc?.goodbye?.enabled ? `✅ <#${doc.goodbye.channelId}>` : "❌", inline: true }, { name: "Boost Msg", value: doc?.boostMessage?.enabled ? `✅ <#${doc.boostMessage.channelId}>` : "❌", inline: true }, { name: "Logging", value: doc?.logging?.enabled ? "✅" : "❌", inline: true }, { name: "Verification", value: doc?.verification?.enabled ? `✅ (${doc.verification.method})` : "❌", inline: true }, { name: "Tickets", value: doc?.tickets?.enabled ? "✅" : "❌", inline: true }, { name: "Leveling", value: doc?.leveling?.enabled ? "✅" : "❌", inline: true }, { name: "AutoMod", value: doc?.automod?.enabled ? "✅" : "❌", inline: true }, { name: "Anti-Nuke", value: doc?.antinuke?.enabled ? "✅" : "❌", inline: true }, { name: "Server Lock", value: doc?.locked ? "🔒 Locked" : "🔓 Unlocked", inline: true }, { name: "Auto-Roles", value: (doc?.autoRoleIds ?? []).length ? `${doc.autoRoleIds.length} role(s)` : "None", inline: true }, { name: "DJ Mode", value: doc?.music?.djMode ? "✅" : "❌", inline: true }, { name: "24/7 Music", value: doc?.music?.mode247 ? "✅" : "❌", inline: true }, { name: "Raid Mode", value: doc?.raidMode?.enabled ? "🚨 Active" : "❌", inline: true }, { name: "Starboard", value: doc?.starboard?.enabled ? `✅ (${doc.starboard.threshold}⭐)` : "❌", inline: true }, { name: "Custom Commands", value: (doc?.customCommands ?? []).length ? `${doc.customCommands.length}` : "0", inline: true })
            .setFooter({ text: `Use /settings for a user-friendly view • ${guild.memberCount} members` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=config.js.map