import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "fishing",
  description: "Go fishing",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const fish = Math.random() < 0.3 ? "🐟" : Math.random() < 0.5 ? "🐠" : "🦐";

    const embed = baseEmbed("primary").setTitle("🎣 Fishing").setDescription(`You caught a ${fish}!`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
