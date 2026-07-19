import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('upper')
    .setDescription('Convert text to uppercase')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text to convert')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const text = interaction.options.getString('text', true);
    
    await interaction.reply({ content: text.toUpperCase(), ephemeral: true });
  },
} as unknown as CommandDefinition;
