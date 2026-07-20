import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "distance",
    description: "Calculate distance between two locations",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b
        .addStringOption((o) => o.setName("from").setDescription("From location").setRequired(true))
        .addStringOption((o) => o.setName("to").setDescription("To location").setRequired(true)),
    async execute(ctx) {
        const from = ctx.isSlash ? ctx.interaction.options.getString("from", true) : ctx.args[0];
        const to = ctx.isSlash ? ctx.interaction.options.getString("to", true) : ctx.args[1];
        await ctx.reply({ embeds: [infoEmbed(`📍 Distance from ${from} to ${to}: [Calculation placeholder]`)] });
    },
};
export default command;
//# sourceMappingURL=distance.js.map