import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "chess",
  description: "Play Chess",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("opponent").setDescription("Opponent").setRequired(false)),
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed("♟️ Chess game started!")] });
  },
};
export default command;
