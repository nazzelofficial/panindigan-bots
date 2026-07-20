import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { infoEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'wordsearch',
  description: 'Play Word Search',
  category: 'Games',
  access: 'general',
  guildOnly: false,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed('🔍 Word search puzzle feature is coming soon!')] });
  },
};
export default command;
