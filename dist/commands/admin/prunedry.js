import { PermissionFlagsBits } from "discord.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "prunedry",
    description: "Preview how many members would be pruned (dry run — no one is kicked)",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.KickMembers],
    guildOnly: true,
    cooldown: 10,
    aliases: ["prunepreview", "prunecount"],
    slashData: (b) => b
        .addIntegerOption((o) => o
        .setName("days")
        .setDescription("Inactivity threshold in days (1–30)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(30)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const days = ctx.isSlash
            ? ctx.interaction.options.getInteger("days", true)
            : parseInt(ctx.args[0] ?? "7", 10);
        if (isNaN(days) || days < 1 || days > 30) {
            await ctx.reply({ embeds: [errorEmbed("Days must be between 1 and 30.")] });
            return;
        }
        const count = await guild.members.prune({ days, dry: true });
        const embed = baseEmbed("info")
            .setTitle("🔍 Prune Dry Run")
            .setDescription(`**${count ?? 0}** member${(count ?? 0) !== 1 ? "s" : ""} would be kicked for inactivity over the past **${days} day${days !== 1 ? "s" : ""}**.\n\nNo one has been kicked. Run \`prunemember ${days}\` to execute.`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=prunedry.js.map