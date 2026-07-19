import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "analytics",
  description: "View bot analytics",
  category: "Utility",
  access: "admin",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const embed = baseEmbed("primary")
      .setTitle("📈 Bot Analytics")
      .addFields(
        { name: "Servers", value: String(ctx.client.guilds.cache.size), inline: true },
        { name: "Users", value: String(ctx.client.users.cache.size), inline: true },
        { name: "Commands Used", value: "0", inline: true }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
