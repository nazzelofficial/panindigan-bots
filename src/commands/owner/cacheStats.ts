import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('cache_stats')
    .setDescription('View bot cache statistics'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    
    const embed = new EmbedBuilder()
      .setTitle('📊 Cache Statistics')
      .setColor('#00ff00')
      .addFields(
        { name: 'Users', value: client.users.cache.size.toString(), inline: true },
        { name: 'Guilds', value: client.guilds.cache.size.toString(), inline: true },
        { name: 'Channels', value: client.channels.cache.size.toString(), inline: true },
        { name: 'Emojis', value: client.emojis.cache.size.toString(), inline: true },
        { name: 'Stickers', value: String((client as any).stickers?.cache?.size ?? 0), inline: true },
        { name: 'Presences', value: String((client as any).presences?.cache?.size ?? 0), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
