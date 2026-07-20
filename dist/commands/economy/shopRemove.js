import { errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "shop_remove",
    description: "Remove an item from the shop (admin only)",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Item name").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0];
        if (!name)
            return;
        // Note: This command uses ShopModel which may not exist in the current schema
        // For now, we'll return an error indicating the shop system needs to be updated
        await ctx.reply({ embeds: [errorEmbed("❌ Shop system is being updated. Please use /shop remove instead.")] });
    },
};
export default command;
//# sourceMappingURL=shopRemove.js.map