import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "craft",
    description: "Craft items from resources",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("item").setDescription("Item to craft").setRequired(true)),
    async execute(ctx) {
        const item = ctx.isSlash ? ctx.interaction.options.getString("item", true) : ctx.args[0];
        if (!item)
            return;
        await ctx.reply({ embeds: [successEmbed(`🔨 Crafting ${item}...`)] });
    },
};
export default command;
//# sourceMappingURL=craft.js.map