import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
// Parses NdM notation, e.g. "2d6", "1d20", "4d4"
function parseDice(input) {
    const match = input.match(/^(\d+)d(\d+)$/i);
    if (!match)
        return null;
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    if (count < 1 || count > 100 || sides < 2 || sides > 1000)
        return null;
    return { count, sides };
}
const command = {
    name: "roll",
    description: "Roll dice using NdM notation (e.g. 2d6, 1d20)",
    category: "Games",
    access: "general",
    guildOnly: false,
    cooldown: 3,
    aliases: ["dice"],
    slashData: (b) => b.addStringOption((o) => o.setName("notation").setDescription("Dice notation e.g. 2d6 (default 1d6)").setRequired(false)),
    async execute(ctx) {
        const notation = (ctx.isSlash ? ctx.interaction.options.getString("notation") : ctx.args[0]) ?? "1d6";
        const parsed = parseDice(notation);
        if (!parsed) {
            await ctx.reply({ embeds: [errorEmbed("Invalid notation. Use NdM format, e.g. `2d6`, `1d20`, `4d4`. Limits: 1-100 dice, 2-1000 sides.")] });
            return;
        }
        const results = [];
        for (let i = 0; i < parsed.count; i++)
            results.push(Math.floor(Math.random() * parsed.sides) + 1);
        const total = results.reduce((a, b) => a + b, 0);
        const embed = baseEmbed("primary")
            .setTitle(`🎲 Rolling ${notation.toLowerCase()}`)
            .addFields({ name: "Results", value: results.length > 20 ? `[${results.join(", ")}]` : results.map((r) => `**${r}**`).join(" + "), inline: false }, { name: "Total", value: String(total), inline: true }, { name: "Average", value: (total / results.length).toFixed(2), inline: true }, { name: "Min / Max", value: `${Math.min(...results)} / ${Math.max(...results)}`, inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=roll.js.map