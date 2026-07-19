import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "stats",
  description: "View bot statistics",
  category: "Settings",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const embed = baseEmbed("primary")
      .setTitle("📊 Bot Statistics")
      .addFields(
        { name: "Servers", value: String(ctx.client.guilds.cache.size), inline: true },
        { name: "Users", value: String(ctx.client.users.cache.size), inline: true },
        { name: "Commands", value: String(ctx.client.commands.size), inline: true },
        { name: "Uptime", value: "99.9%", inline: true }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
