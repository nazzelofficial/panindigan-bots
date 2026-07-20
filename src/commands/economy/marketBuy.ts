import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { MarketListingModel } from "../../database/models/Economy.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "market_buy",
  description: "Buy an item from the server market by listing ID",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("listing_id").setDescription("Listing ID (from /market_list)").setRequired(true))
      .addIntegerOption((o) => o.setName("quantity").setDescription("Quantity to buy (default: 1)").setRequired(false).setMinValue(1)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const listingId = ctx.isSlash ? ctx.interaction!.options.getString("listing_id", true) : ctx.args[0];
    const qty = ctx.isSlash ? ctx.interaction!.options.getInteger("quantity") ?? 1 : parseInt(ctx.args[1]) ?? 1;
    if (!listingId) return;

    const guildId = guild.id;
    const buyerId = ctx.userId;

    const listing = await MarketListingModel.findById(listingId);
    if (!listing || !listing.available || listing.guildId !== guildId) {
      return ctx.reply({ embeds: [errorEmbed("❌ Listing not found or no longer available.")] });
    }

    if (listing.sellerId === buyerId) {
      return ctx.reply({ embeds: [errorEmbed("❌ You cannot buy your own listing.")] });
    }

    if (qty > listing.quantity) {
      return ctx.reply({ embeds: [errorEmbed(`❌ Only **${listing.quantity}** available, but you requested ${qty}.`)] });
    }

    const totalCost = listing.price * qty;

    // Get buyer's balance
    const buyerUser = await UserModel.findOne({ userId: buyerId });
    if (!buyerUser) {
      return ctx.reply({ embeds: [errorEmbed("❌ User not found.")] });
    }
    const buyerProfile = buyerUser.guilds.find((g: any) => g.guildId === guildId);
    const buyerBalance = buyerProfile ? (buyerProfile as any).balance ?? 0 : 0;

    if (buyerBalance < totalCost) {
      return ctx.reply({ embeds: [errorEmbed(`❌ Insufficient funds. You need **${totalCost.toLocaleString()}** coins but only have **${buyerBalance.toLocaleString()}**.`)] });
    }

    // Deduct from buyer
    if (buyerProfile) {
      (buyerProfile as any).balance = buyerBalance - totalCost;
    } else {
      buyerUser.guilds.push({ guildId: guild.id, balance: -totalCost } as any);
    }
    await buyerUser.save();

    // Pay seller
    const sellerUser = await UserModel.findOne({ userId: listing.sellerId });
    if (sellerUser) {
      const sellerProfile = sellerUser.guilds.find((g: any) => g.guildId === guildId);
      if (sellerProfile) {
        (sellerProfile as any).balance = ((sellerProfile as any).balance ?? 0) + totalCost;
      } else {
        sellerUser.guilds.push({ guildId: guild.id, balance: totalCost } as any);
      }
      await sellerUser.save();
    }

    // Update listing quantity
    listing.quantity -= qty;
    if (listing.quantity <= 0) listing.available = false;
    await listing.save();

    // Notify seller
    try {
      const seller = await ctx.client.users.fetch(listing.sellerId);
      await seller.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏪 Item Sold!")
            .setColor("#FFD700")
            .setDescription(`**${(ctx.isSlash ? ctx.interaction?.user?.tag : ctx.message?.author?.tag)}** bought **${qty}x ${listing.item}** from your market listing for **${totalCost.toLocaleString()} coins**!`),
        ],
      });
    } catch { /* DMs disabled */ }

    const embed = baseEmbed("success")
      .setTitle("✅ Purchase Successful")
      .addFields(
        { name: "📦 Item", value: `${qty}x ${listing.item}`, inline: true },
        { name: "💰 Total Paid", value: `🪙 ${totalCost.toLocaleString()}`, inline: true },
        { name: "👤 Seller", value: `<@${listing.sellerId}>`, inline: true },
      );

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
