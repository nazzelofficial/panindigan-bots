import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('typerace')
    .setDescription('Start a type race game'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '⌨️ Type race game started! Type the given text as fast as you can.', ephemeral: true });
  },
} as unknown as CommandDefinition;
