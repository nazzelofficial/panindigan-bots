import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('time')
    .setDescription('Get the current time'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const time = new Date().toLocaleTimeString();
    
    await interaction.reply({ content: `🕐 Current time: ${time}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
