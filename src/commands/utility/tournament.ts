import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Create a tournament')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Tournament name')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'admin',
  async execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    
    await interaction.reply({ content: `🏆 Tournament "${name}" created!`, ephemeral: true });
  },
} as unknown as CommandDefinition;
