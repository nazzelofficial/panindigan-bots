import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "gamedaily",
  description: "Claim your daily game reward",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [successEmbed("🎁 Daily game reward claimed! +100 coins")] });
  },
};
export default command;
