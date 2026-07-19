import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "hunting",
  description: "Go hunting",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const animal = Math.random() < 0.3 ? "🦌" : Math.random() < 0.5 ? "🐇" : "🦊";

    const embed = baseEmbed("primary").setTitle("🏹 Hunting").setDescription(`You spotted a ${animal}!`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
