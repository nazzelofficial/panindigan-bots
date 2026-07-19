import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "gamestats",
  description: "View your game statistics",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const embed = baseEmbed("primary")
      .setTitle("🎮 Game Statistics")
      .addFields(
        { name: "Games Played", value: "0", inline: true },
        { name: "Wins", value: "0", inline: true },
        { name: "Losses", value: "0", inline: true }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
