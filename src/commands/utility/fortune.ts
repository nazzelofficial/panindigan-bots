import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "fortune",
  description: "Get a fortune cookie message",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const fortunes = [
      "A beautiful, smart, and loving person will be coming into your life.",
      "A dubious friend may be an enemy in camouflage.",
      "A faithful friend is a strong defense.",
      "A fresh start will put you on your way.",
      "A golden egg of opportunity falls into your lap this month.",
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    const embed = baseEmbed("primary").setTitle("🥠 Fortune").setDescription(fortune);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
