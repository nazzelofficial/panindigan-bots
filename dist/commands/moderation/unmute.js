import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
import { createModCase } from "@/features/moderation/caseEngine";
import { sendLogEvent } from "@/features/logging/logEngine";
const command = {
    name: "unmute",
    description: "Remove timeout (unmute) a server member",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 3,
    aliases: ["untimeout"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to unmute").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash
            ? (ctx.interaction.options.getString("reason") ?? "No reason provided")
            : ctx.args.slice(1).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a member to unmute.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        if (!member.isCommunicationDisabled()) {
            await ctx.reply({ embeds: [errorEmbed(`<@${targetId}> is not currently timed out.`)] });
            return;
        }
        if (!member.moderatable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot moderate this member.")] });
            return;
        }
        await member.timeout(null, `${reason} | Moderator: ${ctx.userId}`);
        await createModCase({
            guildId: guild.id,
            userId: targetId,
            moderatorId: ctx.userId,
            type: "unmute",
            reason,
        });
        await sendLogEvent(guild.id, "unmute", () => baseEmbed("success")
            .setTitle("🔊 Member Unmuted")
            .addFields({ name: "User", value: `<@${targetId}>`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }));
        await member.send({
            embeds: [
                baseEmbed("success")
                    .setTitle("🔊 Unmuted")
                    .setDescription(`Your timeout in **${guild.name}** has been removed.\nReason: ${reason}`),
            ],
        }).catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`🔊 <@${targetId}> has been unmuted. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=unmute.js.map