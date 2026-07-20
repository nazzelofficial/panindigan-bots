import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timer')
    .setDescription('Set a timer')
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Timer duration in seconds')
        .setRequired(true)
        .setMinValue(1)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger('seconds', true);
    
    await interaction.reply({ content: `⏰ Timer set for ${seconds} seconds!`, ephemeral: true });
  },
} as unknown as CommandDefinition;
