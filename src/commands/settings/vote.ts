import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "vote",
  description: "Get a link to vote for the bot",
  category: "Settings",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("🗳️ Vote for the bot: https://top.gg/vote")] });
  },
};
export default command;
