import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "choose",
  description: "Choose a random option",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("options").setDescription("Options separated by comma").setRequired(true)),
  async execute(ctx) {
    const options = ctx.isSlash ? ctx.interaction!.options.getString("options", true) : ctx.args.join(" ");
    const choice = options.split(",")[Math.floor(Math.random() * options.split(",").length)].trim();

    const embed = baseEmbed("primary").setTitle("🎯 I choose").setDescription(choice);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
