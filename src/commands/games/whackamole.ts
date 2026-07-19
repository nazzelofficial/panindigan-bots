import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { infoEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'whackamole',
  description: 'Play Whack-a-Mole',
  category: 'Games',
  access: 'general',
  guildOnly: false,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    await ctx.reply({ embeds: [infoEmbed('🔨 Whack-a-Mole game feature is coming soon!')] });
  },
};
export default command;
