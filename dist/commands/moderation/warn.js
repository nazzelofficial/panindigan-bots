import { PermissionFlagsBits } from "discord.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { successEmbed, errorEmbed, baseEmbed, warnEmbed } from "../../utils/embeds.js";
import { createModCase } from "../../features/moderation/caseEngine.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
import { config } from "../../config/config.js";
const command = {
    name: "warn",
    description: "Warn a member and auto-escalate based on warning thresholds",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    cooldown: 3,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to warn").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the warning").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true).id
            : ctx.args[0]?.replace(/[<@!>]/g, "");
        const reason = ctx.isSlash
            ? ctx.interaction.options.getString("reason", true)
            : ctx.args.slice(1).join(" ");
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a member to warn.")] });
            return;
        }
        if (!reason) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a reason for the warning.")] });
            return;
        }
        const member = await guild.members.fetch(targetId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
            return;
        }
        await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.userId, type: "warn", reason });
        const warnCount = await ModCaseModel.countDocuments({ guildId: guild.id, userId: targetId, type: "warn", active: true });
        await sendLogEvent(guild.id, "warn", () => baseEmbed("warning")
            .setTitle("⚠️ Member Warned")
            .setDescription(`**User:** <@${targetId}> (Warning #${warnCount})\n**Moderator:** <@${ctx.userId}>\n**Reason:** ${reason}`));
        await member.user.send({
            embeds: [warnEmbed(`You have been warned in **${guild.name}**.\n**Reason:** ${reason}\n**Warning count:** ${warnCount}`)],
        }).catch(() => { });
        // Auto-escalation from config
        const escalation = config.moderation?.warnEscalation ?? [];
        const escalationRule = escalation.find((e) => e.count === warnCount);
        let escalationMsg = "";
        if (escalationRule) {
            try {
                if (escalationRule.action === "kick" && member.kickable) {
                    await member.kick(`Auto-escalation after ${warnCount} warnings`);
                    escalationMsg = `\n🔺 Auto-escalated: **kicked** after ${warnCount} warnings.`;
                    await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.client.user.id, type: "kick", reason: `Auto-escalation after ${warnCount} warnings` });
                }
                else if (escalationRule.action === "ban" && member.bannable) {
                    await member.ban({ reason: `Auto-escalation after ${warnCount} warnings` });
                    escalationMsg = `\n🔺 Auto-escalated: **banned** after ${warnCount} warnings.`;
                    await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.client.user.id, type: "ban", reason: `Auto-escalation after ${warnCount} warnings` });
                }
                else if (escalationRule.action === "mute" && member.moderatable) {
                    const duration = escalationRule.durationMs ?? 30 * 60_000;
                    await member.timeout(duration, `Auto-escalation after ${warnCount} warnings`);
                    escalationMsg = `\n🔺 Auto-escalated: **timed out** after ${warnCount} warnings.`;
                    await createModCase({ guildId: guild.id, userId: targetId, moderatorId: ctx.client.user.id, type: "timeout", reason: `Auto-escalation after ${warnCount} warnings`, duration });
                }
            }
            catch {
                escalationMsg = "\n⚠️ Auto-escalation attempted but failed (insufficient permissions).";
            }
        }
        await ctx.reply({ embeds: [successEmbed(`<@${targetId}> warned (Warning **#${warnCount}**). Reason: ${reason}${escalationMsg}`)] });
    },
};
export default command;
//# sourceMappingURL=warn.js.map