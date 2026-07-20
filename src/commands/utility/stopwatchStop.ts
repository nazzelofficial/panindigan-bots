import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stopwatch_stop')
    .setDescription('Stop the stopwatch'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '⏱️ Stopwatch stopped!', ephemeral: true });
  },
} as unknown as CommandDefinition;
