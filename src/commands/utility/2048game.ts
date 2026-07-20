import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "2048game",
  description: "Play 2048",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("🎮 2048 game started! Combine tiles to reach 2048.")] });
  },
};
export default command;
