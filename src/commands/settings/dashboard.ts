import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "dashboard",
  description: "Get a link to the web dashboard",
  category: "Settings",
  access: "admin",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("🌐 Dashboard: https://dashboard.example.com")] });
  },
};
export default command;
