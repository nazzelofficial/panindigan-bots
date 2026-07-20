import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "define",
    description: "Get the definition of a word",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("word").setDescription("Word to define").setRequired(true)),
    async execute(ctx) {
        const word = ctx.isSlash ? ctx.interaction.options.getString("word", true) : ctx.args.join(" ");
        await ctx.reply({ embeds: [infoEmbed(`📖 Definition for "${word}": [Definition placeholder]`)] });
    },
};
export default command;
//# sourceMappingURL=define.js.map