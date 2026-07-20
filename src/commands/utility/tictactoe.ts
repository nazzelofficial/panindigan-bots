import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Play Tic Tac Toe')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('Opponent')
        .setRequired(false)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🎮 Tic Tac Toe game started!', ephemeral: true });
  },
} as unknown as CommandDefinition;
