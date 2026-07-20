import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { infoEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'memorymatch',
  description: 'Play Memory Match game',
  category: 'Games',
  access: 'general',
  guildOnly: false,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed('🧠 Memory Match game feature is coming soon!')] });
  },
};
export default command;
