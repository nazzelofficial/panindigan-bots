import { ModCaseModel } from "@/database/models/Moderation";
import { config } from "@/config/config";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "escalation",
    description: "View the current escalation stage of a user based on their warning count",
    category: "Moderation",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["escalationstage", "punishstage"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetId = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!targetId) {
            await ctx.reply({ embeds: [errorEmbed("Provide a user to check.")] });
            return;
        }
        const user = await ctx.client.users.fetch(targetId).catch(() => null);
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const warnCount = await ModCaseModel.countDocuments({ guildId: guild.id, userId: targetId, type: "warn", active: true });
        const escalation = config.moderation?.warnEscalation ?? [
            { count: 3, action: "mute", durationMs: 600_000 },
            { count: 5, action: "kick" },
            { count: 7, action: "ban" },
        ];
        // Find current stage
        const currentRule = [...escalation].reverse().find((e) => warnCount >= e.count);
        const nextRule = escalation.find((e) => e.count > warnCount);
        const embed = baseEmbed("warning")
            .setTitle(`📈 Escalation Stage — ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields({ name: "Active Warnings", value: String(warnCount), inline: true }, {
            name: "Current Stage",
            value: currentRule
                ? `**${currentRule.action.toUpperCase()}** at ${currentRule.count} warnings`
                : "⬇️ Below first escalation threshold",
            inline: true,
        }, {
            name: "Next Escalation",
            value: nextRule
                ? `**${nextRule.action.toUpperCase()}** at **${nextRule.count}** warnings (**${nextRule.count - warnCount}** more needed)`
                : "🚨 At maximum escalation level",
            inline: true,
        });
        // Escalation ladder
        const ladder = escalation.map((e) => {
            const reached = warnCount >= e.count;
            const current = currentRule?.count === e.count;
            return `${current ? "👉 " : reached ? "✅ " : "⬜ "}**${e.count} warnings** → ${e.action.toUpperCase()}${e.durationMs ? ` (${Math.round(e.durationMs / 60_000)}m)` : ""}`;
        });
        embed.addFields({ name: "Escalation Ladder", value: ladder.join("\n") || "No escalation rules configured.", inline: false });
        embed.setFooter({ text: "Escalation thresholds are configured in config.json" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=escalation.js.map