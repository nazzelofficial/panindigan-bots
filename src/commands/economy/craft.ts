import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "craft",
  description: "Craft items from resources",
  category: "Economy",
  access: "general",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("item").setDescription("Item to craft").setRequired(true)),
  async execute(ctx) {
    const item = ctx.isSlash ? ctx.interaction!.options.getString("item", true) : ctx.args[0];
    if (!item) return;

    await ctx.reply({ embeds: [successEmbed(`🔨 Crafting ${item}...`)] });
  },
};
export default command;
