import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "checkers",
  description: "Play Checkers",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("opponent").setDescription("Opponent").setRequired(false)),
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("🔴⚫ Checkers game started!")] });
  },
};
export default command;
