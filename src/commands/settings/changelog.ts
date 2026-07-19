import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "changelog",
  description: "View the bot changelog",
  category: "Settings",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const embed = baseEmbed("primary")
      .setTitle("📝 Changelog")
      .setDescription("Version 0.1.2")
      .addFields(
        { name: "Added", value: "• 985+ commands\n• New categories", inline: true },
        { name: "Fixed", value: "• Bug fixes", inline: true },
        { name: "Changed", value: "• Performance improvements", inline: true }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
