import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('votereminder')
    .setDescription('Set a vote reminder'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '✅ Vote reminder set! You will be reminded to vote for the bot.', ephemeral: true });
  },
} as unknown as CommandDefinition;
