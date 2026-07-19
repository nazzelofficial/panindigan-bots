import { MarketListingModel } from "@/database/models/Economy";
import { baseEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "market_list",
    description: "Browse all active market listings in this server",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1))
        .addStringOption((o) => o.setName("search").setDescription("Search by item name").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const page = ((ctx.isSlash ? (ctx.interaction.options.getInteger("page") ?? 1) : parseInt(ctx.args[0]) || 1)) - 1;
        const search = ctx.isSlash ? ctx.interaction.options.getString("search") : ctx.args[1];
        const guildId = guild.id;
        const perPage = 10;
        const query = { guildId, available: true };
        if (search)
            query.item = { $regex: search, $options: "i" };
        const totalCount = await MarketListingModel.countDocuments(query);
        const total = totalCount ?? 0;
        const listings = await MarketListingModel.find(query)
            .sort({ createdAt: -1 })
            .skip(page * perPage)
            .limit(perPage)
            .lean();
        if (listings.length === 0) {
            return ctx.reply({
                embeds: [infoEmbed(search ? `❌ No listings found matching \`${search}\`.` : "📭 The market is empty! Use `/market_sell` to list an item.")]
            });
        }
        const totalPages = Math.ceil((total ?? 0) / perPage);
        const lines = listings.map((l, i) => `**${page * perPage + i + 1}.** \`${l._id}\` — **${l.item}** × ${l.quantity} @ **${l.price.toLocaleString()} coins** — <@${l.sellerId}>${l.description ? `\n   *${l.description}*` : ""}`);
        const embed = baseEmbed("primary")
            .setTitle("🏪 Server Market")
            .setDescription(lines.join("\n\n").slice(0, 4000))
            .setFooter({ text: `Page ${page + 1}/${totalPages} • ${total} listing(s) • Use /market_buy <id> to purchase` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=marketList.js.map