import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, warnEmbed } from "@/utils/embeds";
import { createModCase } from "@/features/moderation/caseEngine";
import { sendLogEvent } from "@/features/logging/logEngine";
import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "ban",
    description: "Ban a user from the server",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))
        .addIntegerOption((o) => o.setName("deletedays").setDescription("Delete message history (0-7 days)").setRequired(false).setMinValue(0).setMaxValue(7)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        const deleteDays = ctx.isSlash ? ctx.interaction.options.getInteger("deletedays") ?? 0 : 0;
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a user.")] });
            return;
        }
        const user = await ctx.client.users.fetch(targetId).catch(() => null);
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (member && !member.bannable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot ban this member.")] });
            return;
        }
        await user.send({ embeds: [warnEmbed(`You have been banned from **${guild.name}**.\nReason: ${reason}`)] }).catch(() => { });
        await guild.bans.create(targetId, { reason, deleteMessageSeconds: deleteDays * 86400 });
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "ban", reason });
        await sendLogEvent(guild.id, "ban", () => baseEmbed("danger").setTitle("🔨 Member Banned").addFields({ name: "User", value: `${user.username} (<@${targetId}>)`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }, { name: "Messages Deleted", value: `${deleteDays} day(s)`, inline: true }));
        await ctx.reply({ embeds: [successEmbed(`**${user.username}** has been banned. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=ban.js.map