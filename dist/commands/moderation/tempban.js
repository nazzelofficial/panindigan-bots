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
    name: "tempban",
    description: "Temporarily ban a user",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to tempban").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Duration e.g. 1h, 7d").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[1];
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(2).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a user.")] });
            return;
        }
        const ms = parseDuration(durationStr);
        if (!ms) {
            await ctx.reply({ embeds: [errorEmbed("Invalid duration (e.g. `1h`, `7d`).")] });
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
        const expiresAt = new Date(Date.now() + ms);
        await user.send({ embeds: [warnEmbed(`You have been temporarily banned from **${guild.name}** for **${durationStr}**.\nReason: ${reason}\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`)] }).catch(() => { });
        await guild.bans.create(targetId, { reason });
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "tempban", reason, duration: ms, expiresAt });
        await sendLogEvent(guild.id, "ban", () => baseEmbed("danger").setTitle("⏱️ Member Temp-Banned").addFields({ name: "User", value: `${user.username} (<@${targetId}>)`, inline: true }, { name: "Duration", value: durationStr, inline: true }, { name: "Expires", value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true }, { name: "Moderator", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false }));
        await ctx.reply({ embeds: [successEmbed(`**${user.username}** temp-banned for **${durationStr}**. Expires <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`)] });
    },
};
export default command;
//# sourceMappingURL=tempban.js.map