import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('wordchain')
    .setDescription('Start a word chain game'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🔗 Word chain game started! Say a word that starts with the last letter of the previous word.', ephemeral: true });
  },
} as unknown as CommandDefinition;
