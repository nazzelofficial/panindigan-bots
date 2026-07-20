import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { createModCase } from "../../features/moderation/caseEngine.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
function parseDuration(str) {
    const match = str?.match(/^(\d+)(s|m|h|d)$/i);
    if (!match)
        return null;
    const v = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return v * (map[unit] ?? 0);
}
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000; // Discord limit: 28 days
const command = {
    name: "timeout",
    description: "Apply or remove a native Discord timeout for a member",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    aliases: ["untimeout"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("add")
        .setDescription("Timeout a member (max 28 days)")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Duration e.g. 10m, 1h, 7d").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("remove")
        .setDescription("Remove a timeout from a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : "add";
        const targetId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(2).join(" ") || "No reason provided";
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Specify a member.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        if (!member.moderatable) {
            await ctx.reply({ embeds: [errorEmbed("I cannot moderate this member — they may outrank me.")] });
            return;
        }
        if (sub === "add") {
            const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[1];
            const durationMs = parseDuration(durationStr);
            if (!durationMs || durationMs > MAX_TIMEOUT_MS) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Use e.g. `10m`, `1h`, `7d`. Max is 28 days.")] });
                return;
            }
            await member.timeout(durationMs, `${reason} | Mod: ${ctx.userId}`);
            await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "timeout", reason, duration: durationMs });
            await sendLogEvent(guild.id, "timeout", () => baseEmbed("warning")
                .setTitle("⏱️ Member Timed Out")
                .setDescription(`**User:** <@${targetId}>\n**Duration:** ${durationStr}\n**Moderator:** <@${ctx.userId}>\n**Reason:** ${reason}\n**Expires:** <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`));
            await ctx.reply({ embeds: [successEmbed(`<@${targetId}> has been timed out for **${durationStr}**. Reason: ${reason}`)] });
        }
        else {
            await member.timeout(null, `Timeout removed by ${ctx.userId}: ${reason}`);
            await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "untimeout", reason });
            await sendLogEvent(guild.id, "untimeout", () => baseEmbed("success")
                .setTitle("⏱️ Timeout Removed")
                .setDescription(`**User:** <@${targetId}>\n**Moderator:** <@${ctx.userId}>\n**Reason:** ${reason}`));
            await ctx.reply({ embeds: [successEmbed(`Timeout removed from <@${targetId}>.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=timeout.js.map