import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('randomemoji')
    .setDescription('Get a random emoji'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const emojis = ['😀', '😂', '😍', '🥳', '🎉', '🔥', '❤️', '💯', '✨', '🚀'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    await interaction.reply({ content: emoji, ephemeral: true });
  },
} as unknown as CommandDefinition;
