import { UserModel } from "@/database/models/User";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
// Server shop items stored in guild config. Each item: { id, name, price, description, stock }
const command = {
    name: "shop",
    description: "Browse and buy items from the server shop",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("view").setDescription("Browse the shop"))
        .addSubcommand((s) => s.setName("buy")
        .setDescription("Buy an item from the shop")
        .addStringOption((o) => o.setName("item").setDescription("Item name or ID").setRequired(true))
        .addIntegerOption((o) => o.setName("quantity").setDescription("Quantity (default 1)").setRequired(false).setMinValue(1)))
        .addSubcommand((s) => s.setName("add")
        .setDescription("Add an item to the shop (Admin)")
        .addStringOption((o) => o.setName("name").setDescription("Item name").setRequired(true))
        .addIntegerOption((o) => o.setName("price").setDescription("Price in coins").setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName("description").setDescription("Item description").setRequired(false))
        .addIntegerOption((o) => o.setName("stock").setDescription("Stock (-1 = unlimited)").setRequired(false)))
        .addSubcommand((s) => s.setName("remove")
        .setDescription("Remove an item from the shop (Admin)")
        .addStringOption((o) => o.setName("name").setDescription("Item name").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const shopItems = cfg?.shopItems ?? [];
        if (sub === "view") {
            if (!shopItems.length) {
                await ctx.reply({ embeds: [infoEmbed("The shop is empty. An admin can add items with `/shop add`.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle(`🛒 ${guild.name} Shop`)
                .setDescription(shopItems
                .map((item, i) => `**${i + 1}. ${item.name}** — 🪙 **${item.price.toLocaleString()}**\n${item.description ? `> ${item.description}` : ""} ${item.stock >= 0 ? `*(${item.stock} in stock)*` : "*(unlimited)*"}`)
                .join("\n\n")
                .slice(0, 4000))
                .setFooter({ text: `${shopItems.length} item(s) available` });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "buy") {
            const itemQuery = ctx.isSlash ? ctx.interaction.options.getString("item", true) : ctx.args[1];
            const qty = ctx.isSlash ? ctx.interaction.options.getInteger("quantity") ?? 1 : parseInt(ctx.args[2] ?? "1") || 1;
            const item = shopItems.find((i) => i.name.toLowerCase() === itemQuery?.toLowerCase() || i.id === itemQuery);
            if (!item) {
                await ctx.reply({ embeds: [errorEmbed("Item not found in the shop.")] });
                return;
            }
            if (item.stock >= 0 && item.stock < qty) {
                await ctx.reply({ embeds: [errorEmbed(`Not enough stock. Only **${item.stock}** left.`)] });
                return;
            }
            const totalCost = item.price * qty;
            const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
            let profile = user.guilds.find((g) => g.guildId === guild.id);
            if (!profile) {
                user.guilds.push({ guildId: guild.id });
                await user.save();
                profile = user.guilds[user.guilds.length - 1];
            }
            const wallet = profile.balance ?? 0;
            if (wallet < totalCost) {
                await ctx.reply({ embeds: [errorEmbed(`You need 🪙 **${totalCost.toLocaleString()}** but only have 🪙 **${wallet.toLocaleString()}**.`)] });
                return;
            }
            profile.balance -= totalCost;
            profile.totalSpent = (profile.totalSpent ?? 0) + totalCost;
            const inv = profile.inventory ?? [];
            const existing = inv.find((i) => i.itemId === item.id);
            if (existing)
                existing.quantity = (existing.quantity ?? 1) + qty;
            else
                inv.push({ itemId: item.id, name: item.name, quantity: qty });
            profile.inventory = inv;
            await user.save();
            // Update stock
            if (item.stock >= 0) {
                await GuildModel.updateOne({ guildId: guild.id, "shopItems.id": item.id }, { $inc: { "shopItems.$.stock": -qty } });
            }
            await ctx.reply({ embeds: [successEmbed(`Purchased **${qty}× ${item.name}** for 🪙 **${totalCost.toLocaleString()}**. Balance: 🪙 **${(profile.balance).toLocaleString()}**.`)] });
        }
        else if (sub === "add") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has("ManageGuild")) {
                await ctx.reply({ embeds: [errorEmbed("You need **Manage Server** to add shop items.")] });
                return;
            }
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const price = ctx.isSlash ? ctx.interaction.options.getInteger("price", true) : parseInt(ctx.args[2] ?? "0");
            const description = ctx.isSlash ? ctx.interaction.options.getString("description") ?? "" : ctx.args.slice(3).join(" ");
            const stock = ctx.isSlash ? ctx.interaction.options.getInteger("stock") ?? -1 : -1;
            if (!name || !price) {
                await ctx.reply({ embeds: [errorEmbed("Provide item name and price.")] });
                return;
            }
            const id = name.toLowerCase().replace(/\s+/g, "-");
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { shopItems: { id, name, price, description, stock } } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Added **${name}** to the shop for 🪙 **${price.toLocaleString()}**.`)] });
        }
        else if (sub === "remove") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has("ManageGuild")) {
                await ctx.reply({ embeds: [errorEmbed("You need **Manage Server** to remove shop items.")] });
                return;
            }
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { shopItems: { name } } });
            await ctx.reply({ embeds: [successEmbed(`Removed **${name}** from the shop.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: view | buy | add | remove")] });
        }
    },
};
export default command;
//# sourceMappingURL=shop.js.map