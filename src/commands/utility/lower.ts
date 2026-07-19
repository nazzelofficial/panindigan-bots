import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "lower",
  description: "Convert text to lowercase",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("text").setDescription("Text to convert").setRequired(true)),
  async execute(ctx) {
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    await ctx.reply({ embeds: [infoEmbed(text.toLowerCase())], ephemeral: true });
  },
};
export default command;
