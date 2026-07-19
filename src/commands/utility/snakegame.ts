import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('snakegame')
    .setDescription('Play Snake'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🐍 Snake game started!', ephemeral: true });
  },
} as unknown as CommandDefinition;
