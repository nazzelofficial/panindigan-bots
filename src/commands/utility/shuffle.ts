import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('utilityshuffle')
    .setDescription('Shuffle a list of items')
    .addStringOption(option =>
      option.setName('items')
        .setDescription('Items separated by comma')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const items = interaction.options.getString('items', true).split(',').map(i => i.trim());
    const shuffled = items.sort(() => Math.random() - 0.5).join(', ');
    
    await interaction.reply({ content: `🔀 Shuffled: ${shuffled}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
