import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('playing')
    .setDescription('Show currently playing song (alias for nowplaying)'),
  category: 'Music',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const queue = (interaction.client as any).lavalink.getQueue(interaction.guildId);
    
    if (!queue || !queue.currentTrack) {
      return interaction.reply({ content: '❌ No music playing', ephemeral: true });
    }
    
    const track = queue.currentTrack;
    const embed = new EmbedBuilder()
      .setTitle('🎵 Now Playing')
      .setColor('#00ff00')
      .setDescription(track.title)
      .addFields(
        { name: 'Duration', value: track.duration, inline: true },
        { name: 'Requested by', value: track.requestedBy, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
