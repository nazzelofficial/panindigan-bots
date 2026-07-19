import { SlashCommandBuilder, version as djsVersion } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "botversion",
  description: "View the bot version",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const botVersion = "0.1.5";

    const embed = baseEmbed("primary")
      .setTitle("🤖 Bot Version")
      .addFields(
        { name: "Version", value: `v${botVersion}`, inline: true },
        { name: "Discord.js", value: `v${djsVersion}`, inline: true },
        { name: "Node.js", value: process.version, inline: true }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
