import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "shop_sell",
  description: "Sell an item from your inventory",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const itemName = ctx.isSlash ? ctx.interaction!.options.getString("item", true) : ctx.args[0];
    if (!itemName) return;

    // Note: This command uses ShopModel which may not exist in the current schema
    // For now, we'll return an error indicating the shop system needs to be updated
    await ctx.reply({ embeds: [errorEmbed("❌ Shop system is being updated. Please use /market_sell instead.")] });
  },
};
export default command;
