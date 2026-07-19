import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "verifysetup",
    description: "Quick verification setup — channel, role, and method in one command",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Verification channel for unverified members").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to give verified members").setRequired(true))
        .addStringOption((o) => o.setName("method").setDescription("Verification method (default: button)").setRequired(false)
        .addChoices({ name: "Button (Free)", value: "button" }, { name: "Captcha (⭐ Premium)", value: "captcha" }, { name: "Math Problem (⭐ Premium)", value: "math" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
        if (!channelId || !roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify both a channel and a role.")] });
            return;
        }
        const method = ctx.isSlash ? (ctx.interaction.options.getString("method") ?? "button") : (ctx.args[2] ?? "button");
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
            $set: {
                "verification.channelId": channelId,
                "verification.roleId": roleId,
                verifiedRoleId: roleId,
                "verification.method": method,
                "verification.enabled": true,
            },
        }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Verification **enabled**!\n• Channel: <#${channelId}>\n• Role: <@&${roleId}>\n• Method: **${method}**\n\nUse \`/verifypanel\` to send the verification panel in the channel.`)] });
    },
};
export default command;
//# sourceMappingURL=verifySetup.js.map