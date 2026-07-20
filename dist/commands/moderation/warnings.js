import { PermissionFlagsBits } from "discord.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { baseEmbed, errorEmbed, infoEmbed, successEmbed } from "../../utils/embeds.js";
const command = {
    name: "warnings",
    description: "View or clear a member's active warnings",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 5,
    aliases: ["warns"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("list")
        .setDescription("List a user's active warnings")
        .addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(true)))
        .addSubcommand((s) => s.setName("clear")
        .setDescription("Clear all active warnings for a user")
        .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)))
        .addSubcommand((s) => s.setName("remove")
        .setDescription("Remove a specific warning by case number")
        .addIntegerOption((o) => o.setName("casenumber").setDescription("Case number").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "list";
        if (sub === "list") {
            const target = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
            if (!target) {
                await ctx.reply({ embeds: [errorEmbed("User not found.")] });
                return;
            }
            const warns = await ModCaseModel.find({ guildId: guild.id, userId: target.id, type: "warn", active: true }).sort({ createdAt: -1 }).lean();
            if (!warns.length) {
                await ctx.reply({ embeds: [infoEmbed(`${target.username} has no active warnings.`)] });
                return;
            }
            const embed = baseEmbed("warning")
                .setTitle(`⚠️ Warnings — ${target.username} (${warns.length})`)
                .setThumbnail(target.displayAvatarURL())
                .setDescription(warns.map((w) => `**Case #${w.caseId}** — ${w.reason ?? "No reason"}\n> By <@${w.moderatorId}> · <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>`).join("\n\n").slice(0, 4000));
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "clear") {
            const target = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
            if (!target) {
                await ctx.reply({ embeds: [errorEmbed("User not found.")] });
                return;
            }
            const result = await ModCaseModel.updateMany({ guildId: guild.id, userId: target.id, type: "warn", active: true }, { $set: { active: false } });
            await ctx.reply({ embeds: [successEmbed(`Cleared **${result.modifiedCount}** warning(s) for ${target.username}.`)] });
        }
        else if (sub === "remove") {
            const caseNum = ctx.isSlash ? ctx.interaction.options.getInteger("casenumber", true) : parseInt(ctx.args[1] ?? "0");
            const updated = await ModCaseModel.findOneAndUpdate({ guildId: guild.id, caseId: caseNum, type: "warn" }, { $set: { active: false } });
            if (!updated) {
                await ctx.reply({ embeds: [errorEmbed(`Warning case #${caseNum} not found.`)] });
                return;
            }
            await ctx.reply({ embeds: [successEmbed(`Warning case #${caseNum} removed.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: list | clear | remove")] });
        }
    },
};
export default command;
//# sourceMappingURL=warnings.js.map