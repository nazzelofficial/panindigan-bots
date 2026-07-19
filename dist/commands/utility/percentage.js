import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "percentage",
    description: "Calculate percentage",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b
        .addNumberOption((o) => o.setName("value").setDescription("Value").setRequired(true))
        .addNumberOption((o) => o.setName("total").setDescription("Total").setRequired(true)),
    async execute(ctx) {
        const value = ctx.isSlash ? ctx.interaction.options.getNumber("value", true) : parseFloat(ctx.args[0] ?? "0");
        const total = ctx.isSlash ? ctx.interaction.options.getNumber("total", true) : parseFloat(ctx.args[1] ?? "0");
        const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);
        const embed = baseEmbed("primary").setTitle("📊 Percentage").setDescription(`${value} is ${percentage}% of ${total}`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=percentage.js.map