import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "goodbye info",
    description: "View goodbye system configuration",
    category: "Goodbye",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const goodbyeCfg = cfg?.goodbye || {};
        const embed = successEmbed("Goodbye System Information")
            .addFields({ name: "Status", value: goodbyeCfg.enabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Channel", value: goodbyeCfg.channelId ? `<#${goodbyeCfg.channelId}>` : "Not set", inline: true }, { name: "Embed Format", value: goodbyeCfg.embed ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "DM Goodbye", value: goodbyeCfg.dmEnabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Buttons", value: goodbyeCfg.buttons ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Color", value: goodbyeCfg.color || "#ED4245", inline: true }, { name: "Theme", value: goodbyeCfg.theme || "default", inline: true }, { name: "Language", value: goodbyeCfg.language || "en", inline: true });
        if (goodbyeCfg.message) {
            embed.addFields({ name: "Message", value: goodbyeCfg.message.substring(0, 100) + (goodbyeCfg.message.length > 100 ? "..." : ""), inline: false });
        }
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=goodbyeInfo.js.map