import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, warnEmbed } from "../../utils/embeds.js";
import { createModCase } from "../../features/moderation/caseEngine.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
import { baseEmbed } from "../../utils/embeds.js";
function parseDuration(str) {
    const match = str?.match(/^(\d+)(s|m|h|d)$/i);
    if (!match)
        return null;
    const v = parseInt(match[1]);
    const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return v * (map[match[2].toLowerCase()] ?? 0);
}
const command = {
    name: "mute",
    description: "Timeout (mute) a member",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 5,
    aliases: ["timeout"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to timeout").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Duration e.g. 30m, 1h, 1d (max 28d)").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[1];
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(2).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a member.")] });
            return;
        }
        if (!durationStr) {
            await ctx.reply({ embeds: [errorEmbed("Provide a duration (e.g. `30m`, `1h`, `1d`).")] });
            return;
        }
        const durationMs = parseDuration(durationStr);
        if (!durationMs || durationMs > 28 * 24 * 60 * 60 * 1000) {
            await ctx.reply({ embeds: [errorEmbed("Invalid duration. Max: 28 days.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        if (!member.moderatable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot timeout this member.")] });
            return;
        }
        await member.timeout(durationMs, reason);
        await member.send({ embeds: [warnEmbed(`You have been timed out in **${guild.name}** for **${durationStr}**.\nReason: ${reason}`)] }).catch(() => { });
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "timeout", reason, duration: durationMs });
        await sendLogEvent(guild.id, "mute", () => baseEmbed("warning").setTitle("🔇 Member Timed Out").addFields({ name: "User", value: `<@${targetId}>`, inline: true }, { name: "Duration", value: durationStr, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }, { name: "Expires", value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: true }));
        await ctx.reply({ embeds: [successEmbed(`<@${targetId}> timed out for **${durationStr}**. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=mute.js.map