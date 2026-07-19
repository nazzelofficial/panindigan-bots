import { SlashCommandBuilder, EmbedBuilder, TextChannel } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { AuctionModel } from "@/database/models/Economy";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "auction_start",
  description: "Start an auction in this channel",
  category: "Economy",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("item").setDescription("Item name being auctioned").setRequired(true).setMaxLength(100))
      .addIntegerOption((o) => o.setName("starting_bid").setDescription("Starting bid in coins").setRequired(true).setMinValue(1))
      .addIntegerOption((o) => o.setName("duration").setDescription("Duration in minutes (1–1440)").setRequired(true).setMinValue(1).setMaxValue(1440))
      .addStringOption((o) => o.setName("description").setDescription("Item description").setRequired(false).setMaxLength(256)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const item = ctx.isSlash ? ctx.interaction!.options.getString("item", true) : ctx.args[0];
    const startingBid = ctx.isSlash ? ctx.interaction!.options.getInteger("starting_bid", true) : parseInt(ctx.args[1]);
    const duration = ctx.isSlash ? ctx.interaction!.options.getInteger("duration", true) : parseInt(ctx.args[2]);
    const description = ctx.isSlash ? ctx.interaction!.options.getString("description") ?? "" : ctx.args.slice(3).join(" ");
    if (!item || !startingBid || !duration) return;

    const guildId = guild.id;

    // Check for active auction
    const active = await AuctionModel.findOne({ guildId, ended: false });
    if (active) {
      return ctx.reply({ embeds: [errorEmbed("❌ There is already an active auction running! End it with `/auction_end` first.")] });
    }

    const endsAt = new Date(Date.now() + duration * 60 * 1000);

    const embed = baseEmbed("primary")
      .setTitle("🎪 Auction Started!")
      .addFields(
        { name: "📦 Item", value: item, inline: true },
        { name: "💰 Starting Bid", value: `🪙 ${startingBid.toLocaleString()}`, inline: true },
        { name: "⏰ Ends", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
      )
      .setDescription(description || "No description provided.")
      .setFooter({ text: `Use /bid <amount> to participate! Hosted by ${(ctx.isSlash ? ctx.interaction?.user?.tag : ctx.message?.author?.tag)}` });

    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const msg = await (channel as TextChannel).send({ embeds: [embed] });

    await AuctionModel.create({
      guildId,
      channelId: channel.id,
      messageId: msg.id,
      hostId: ctx.userId,
      item,
      description,
      startingBid,
      currentBid: startingBid,
      endsAt,
    });

    await ctx.reply({ embeds: [successEmbed(`✅ Auction for **${item}** started! Ends <t:${Math.floor(endsAt.getTime() / 1000)}:R>.`)] });
  },
};
export default command;
