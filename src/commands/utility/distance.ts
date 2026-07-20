import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "distance",
  description: "Calculate distance between two locations",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("from").setDescription("From location").setRequired(true))
      .addStringOption((o) => o.setName("to").setDescription("To location").setRequired(true)),
  async execute(ctx) {
    const from = ctx.isSlash ? ctx.interaction!.options.getString("from", true) : ctx.args[0];
    const to = ctx.isSlash ? ctx.interaction!.options.getString("to", true) : ctx.args[1];
    await ctx.reply({ embeds: [infoEmbed(`📍 Distance from ${from} to ${to}: [Calculation placeholder]`)] });
  },
};
export default command;
