import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "mines",
  description: "Play Mines game",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("💣 Mines game started! Avoid the mines!")] });
  },
};
export default command;
