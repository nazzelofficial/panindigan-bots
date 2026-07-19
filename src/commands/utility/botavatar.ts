import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "botavatar",
  description: "View the bot avatar",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const bot = ctx.client.user;
    const avatar = bot?.avatarURL();

    const embed = baseEmbed("primary")
      .setTitle("🤖 Bot Avatar")
      .setThumbnail(avatar ?? null)
      .setDescription(`${bot?.tag}`)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
