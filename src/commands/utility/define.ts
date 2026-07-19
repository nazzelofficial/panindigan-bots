import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "define",
  description: "Get the definition of a word",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("word").setDescription("Word to define").setRequired(true)),
  async execute(ctx) {
    const word = ctx.isSlash ? ctx.interaction!.options.getString("word", true) : ctx.args.join(" ");
    await ctx.reply({ embeds: [infoEmbed(`📖 Definition for "${word}": [Definition placeholder]`)] });
  },
};
export default command;
