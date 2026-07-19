import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, warnEmbed } from "../../utils/embeds";
import { createModCase } from "../../features/moderation/caseEngine";
import { sendLogEvent } from "../../features/logging/logEngine";
import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "softban",
    description: "Ban then immediately unban a member (to delete their messages)",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to softban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
        .addIntegerOption((o) => o.setName("deletedays").setDescription("Days of messages to delete (1-7)").setRequired(false).setMinValue(1).setMaxValue(7)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        const deleteDays = ctx.isSlash ? ctx.interaction.options.getInteger("deletedays") ?? 1 : 1;
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a member.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member || !member.bannable) {
            await ctx.reply({ embeds: [errorEmbed("Member not found or cannot be banned.")] });
            return;
        }
        await member.send({ embeds: [warnEmbed(`You have been softbanned from **${guild.name}** (your messages were deleted, but you can rejoin).\nReason: ${reason}`)] }).catch(() => { });
        await guild.bans.create(targetId, { reason: `Softban: ${reason}`, deleteMessageSeconds: deleteDays * 86400 });
        await guild.bans.remove(targetId, "Softban — immediate unban").catch(() => { });
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "softban", reason });
        await sendLogEvent(guild.id, "ban", () => baseEmbed("warning").setTitle("🧹 Member Softbanned").addFields({ name: "User", value: `${member.user.username} (<@${targetId}>)`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Messages Deleted", value: `${deleteDays} day(s)`, inline: true }, { name: "Reason", value: reason, inline: false }));
        await ctx.reply({ embeds: [successEmbed(`**${member.user.username}** softbanned — messages cleared, can rejoin.`)] });
    },
};
export default command;
//# sourceMappingURL=softban.js.map