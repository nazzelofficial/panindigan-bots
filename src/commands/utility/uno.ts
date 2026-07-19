import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('uno')
    .setDescription('Play UNO')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('Opponent')
        .setRequired(false)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🃏 UNO game started!', ephemeral: true });
  },
} as unknown as CommandDefinition;
