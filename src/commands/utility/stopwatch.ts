import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stopwatch')
    .setDescription('Start a stopwatch'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '⏱️ Stopwatch started! Use `/stopwatch_stop` to stop it.', ephemeral: true });
  },
} as unknown as CommandDefinition;
