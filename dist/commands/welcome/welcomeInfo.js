import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "welcome info",
    description: "View welcome system configuration",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const welcomeCfg = cfg?.welcome || {};
        const embed = successEmbed("Welcome System Information")
            .addFields({ name: "Status", value: welcomeCfg.enabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Channel", value: welcomeCfg.channelId ? `<#${welcomeCfg.channelId}>` : "Not set", inline: true }, { name: "Embed Format", value: welcomeCfg.embed ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "DM Welcome", value: welcomeCfg.dmEnabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Buttons", value: welcomeCfg.buttons ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Color", value: welcomeCfg.color || "#57F287", inline: true }, { name: "Theme", value: welcomeCfg.theme || "default", inline: true }, { name: "Language", value: welcomeCfg.language || "en", inline: true }, { name: "Autorole", value: welcomeCfg.autoroleId ? `<@&${welcomeCfg.autoroleId}>` : "None", inline: true });
        if (welcomeCfg.message) {
            embed.addFields({ name: "Message", value: welcomeCfg.message.substring(0, 100) + (welcomeCfg.message.length > 100 ? "..." : ""), inline: false });
        }
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=welcomeInfo.js.map