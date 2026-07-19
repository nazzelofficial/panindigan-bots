import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('serveremojis')
    .setDescription('List all server emojis'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const emojis = interaction.guild?.emojis.cache;
    const emojiList = emojis?.map(e => `${e} - \`:${e.name}:\``).join('\n') || 'No emojis';
    
    const embed = new EmbedBuilder()
      .setTitle('😀 Server Emojis')
      .setColor('#00ff00')
      .setDescription(emojiList)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
