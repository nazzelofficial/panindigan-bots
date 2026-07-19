import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds";
import { createModCase } from "../../features/moderation/caseEngine";
import { sendLogEvent } from "../../features/logging/logEngine";
import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "unban",
    description: "Unban a user from the server",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addStringOption((o) => o.setName("userid").setDescription("User ID to unban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getString("userid", true) : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a user ID.")] });
            return;
        }
        const ban = await guild.bans.fetch(targetId).catch(() => null);
        if (!ban) {
            await ctx.reply({ embeds: [errorEmbed("That user is not banned.")] });
            return;
        }
        await guild.bans.remove(targetId, reason);
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "unban", reason });
        await sendLogEvent(guild.id, "banRemove", () => baseEmbed("success").setTitle("✅ Member Unbanned").addFields({ name: "User", value: `${ban.user.username} (<@${targetId}>)`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }));
        await ctx.reply({ embeds: [successEmbed(`**${ban.user.username}** has been unbanned. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=unban.js.map