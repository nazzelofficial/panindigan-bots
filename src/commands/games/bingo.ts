import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { infoEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'bingo',
  description: 'Start a Bingo game',
  category: 'Games',
  access: 'general',
  guildOnly: true,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed('🎱 Bingo game feature is coming soon!')] });
  },
};
export default command;
