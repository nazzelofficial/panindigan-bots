import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('utilitywordle')
    .setDescription('Play Wordle'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🎮 Wordle game started! Guess a 5-letter word.', ephemeral: true });
  },
} as unknown as CommandDefinition;
