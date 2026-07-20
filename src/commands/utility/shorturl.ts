import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shorturl')
    .setDescription('Shorten a URL')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL to shorten')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url', true);
    
    await interaction.reply({ content: `🔗 Shortened URL: https://short.url/[placeholder]`, ephemeral: true });
  },
} as unknown as CommandDefinition;
