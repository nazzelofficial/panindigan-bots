import { errorEmbed } from "../../utils/embeds";
const command = {
    name: "shop_add",
    description: "Add an item to the shop (admin only)",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("name").setDescription("Item name").setRequired(true))
        .addIntegerOption((o) => o.setName("price").setDescription("Item price").setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName("description").setDescription("Item description").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0];
        const price = ctx.isSlash ? ctx.interaction.options.getInteger("price", true) : parseInt(ctx.args[1]);
        const description = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.slice(2).join(" ");
        if (!name || !price || !description)
            return;
        // Note: This command uses ShopModel which may not exist in the current schema
        // For now, we'll return an error indicating the shop system needs to be updated
        await ctx.reply({ embeds: [errorEmbed("❌ Shop system is being updated. Please use /shop add instead.")] });
    },
};
export default command;
//# sourceMappingURL=shopAdd.js.map