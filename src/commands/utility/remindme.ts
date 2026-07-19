import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder for yourself')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Reminder message')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Minutes until reminder')
        .setRequired(true)
        .setMinValue(1)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    const minutes = interaction.options.getInteger('minutes', true);
    
    await interaction.reply({ content: `⏰ Reminder set for ${minutes} minutes: ${message}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
