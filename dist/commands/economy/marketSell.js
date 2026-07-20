import { MarketListingModel } from "../../database/models/Economy.js";
import { errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "market_sell",
    description: "List an item for sale on the server market",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true).setMaxLength(64))
        .addIntegerOption((o) => o.setName("price").setDescription("Price in coins").setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName("quantity").setDescription("Quantity to sell (default: 1)").setRequired(false).setMinValue(1).setMaxValue(99))
        .addStringOption((o) => o.setName("description").setDescription("Item description").setRequired(false).setMaxLength(120)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const item = ctx.isSlash ? ctx.interaction.options.getString("item", true) : ctx.args[0];
        const price = ctx.isSlash ? ctx.interaction.options.getInteger("price", true) : parseInt(ctx.args[1]);
        const quantity = ctx.isSlash ? ctx.interaction.options.getInteger("quantity") ?? 1 : parseInt(ctx.args[2]) ?? 1;
        const description = ctx.isSlash ? ctx.interaction.options.getString("description") ?? "" : ctx.args.slice(3).join(" ");
        if (!item || !price)
            return;
        const guildId = guild.id;
        const sellerId = ctx.userId;
        // Limit listings per user per server
        const existing = await MarketListingModel.countDocuments({ guildId, sellerId, available: true });
        if (existing >= 10) {
            return ctx.reply({ embeds: [errorEmbed("❌ You can only have up to **10** active market listings. Remove some before adding more.")] });
        }
        const listing = await MarketListingModel.create({ guildId, sellerId, item, price, quantity, description, available: true });
        const embed = baseEmbed("success")
            .setTitle("🏪 Market Listing Created")
            .addFields({ name: "📦 Item", value: item, inline: true }, { name: "💰 Price", value: `🪙 ${price.toLocaleString()}`, inline: true }, { name: "📊 Quantity", value: quantity.toString(), inline: true }, { name: "🆔 Listing ID", value: `\`${listing.id}\``, inline: false })
            .setDescription(description || "No description.")
            .setFooter({ text: "Use /market_list to view all listings • /market_buy <id> to purchase" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=marketSell.js.map