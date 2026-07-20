import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('year')
    .setDescription('Get the current year'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const year = new Date().getFullYear();
    
    await interaction.reply({ content: `📅 Current year: ${year}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
