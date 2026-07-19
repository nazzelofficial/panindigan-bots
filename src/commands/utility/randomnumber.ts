import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('randomnumber')
    .setDescription('Generate a random number')
    .addIntegerOption(option =>
      option.setName('min')
        .setDescription('Minimum value')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('max')
        .setDescription('Maximum value')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const min = interaction.options.getInteger('min', true);
    const max = interaction.options.getInteger('max', true);
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    
    await interaction.reply({ content: `🔢 Random number: ${result} (${min}-${max})`, ephemeral: true });
  },
} as unknown as CommandDefinition;
