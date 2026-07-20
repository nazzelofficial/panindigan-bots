import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, warnEmbed } from "../../utils/embeds.js";
import { createModCase } from "../../features/moderation/caseEngine.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "kick",
    description: "Kick a member from the server",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to kick").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a member.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        if (!member.kickable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot kick this member.")] });
            return;
        }
        await member.send({ embeds: [warnEmbed(`You were kicked from **${guild.name}**. Reason: ${reason}`)] }).catch(() => { });
        await member.kick(reason);
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "kick", reason });
        await sendLogEvent(guild.id, "kick", () => baseEmbed("danger").setTitle("👢 Member Kicked").addFields({ name: "User", value: `<@${targetId}>`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }));
        await ctx.reply({ embeds: [successEmbed(`<@${targetId}> has been kicked. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=kick.js.map