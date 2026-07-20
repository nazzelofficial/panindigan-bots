import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "choose",
    description: "Choose a random option",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("options").setDescription("Options separated by comma").setRequired(true)),
    async execute(ctx) {
        const options = ctx.isSlash ? ctx.interaction.options.getString("options", true) : ctx.args.join(" ");
        const choice = options.split(",")[Math.floor(Math.random() * options.split(",").length)].trim();
        const embed = baseEmbed("primary").setTitle("🎯 I choose").setDescription(choice);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=choose.js.map