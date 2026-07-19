import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a die')
    .addIntegerOption(option =>
      option.setName('sides')
        .setDescription('Number of sides')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(100)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const result = Math.floor(Math.random() * sides) + 1;
    
    await interaction.reply({ content: `🎲 Rolled a ${result} (1-${sides})`, ephemeral: true });
  },
} as unknown as CommandDefinition;
