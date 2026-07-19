import { errorEmbed } from "../../utils/embeds";
const command = {
    name: "shop_sell",
    description: "Sell an item from your inventory",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const itemName = ctx.isSlash ? ctx.interaction.options.getString("item", true) : ctx.args[0];
        if (!itemName)
            return;
        // Note: This command uses ShopModel which may not exist in the current schema
        // For now, we'll return an error indicating the shop system needs to be updated
        await ctx.reply({ embeds: [errorEmbed("❌ Shop system is being updated. Please use /market_sell instead.")] });
    },
};
export default command;
//# sourceMappingURL=shopSell.js.map