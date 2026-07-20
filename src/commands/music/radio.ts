import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

// Curated list of public radio stream URLs
const RADIO_STATIONS: Record<string, { name: string; url: string; genre: string }> = {
  lofi:        { name: '🎧 Lo-Fi Hip Hop',      url: 'https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/',  genre: 'Chill / Lo-Fi' },
  jazz:        { name: '🎺 Jazz24',              url: 'https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1',          genre: 'Jazz' },
  classical:   { name: '🎻 Classic FM',          url: 'https://media-ice.musicradio.com/ClassicFMMP3',                   genre: 'Classical' },
  pop:         { name: '📻 1.FM Top 40',         url: 'https://strm112.1.fm/top40_mobile_mp3',                           genre: 'Pop / Top 40' },
  rock:        { name: '🎸 Radio Paradise Rock', url: 'https://stream.radioparadise.com/rock-320',                       genre: 'Rock' },
  edm:         { name: '⚡ Digitally Imported',  url: 'https://prem2.di.fm/trance?ad-free=1',                           genre: 'EDM / Trance' },
  rnb:         { name: '🎤 181.FM R&B',          url: 'https://listen.181fm.com/181-rnb_128k.mp3',                       genre: 'R&B / Soul' },
  country:     { name: '🤠 181.FM Country',      url: 'https://listen.181fm.com/181-eagle_128k.mp3',                     genre: 'Country' },
  hiphop:      { name: '🎵 Hip Hop Radio',       url: 'https://strm112.1.fm/hiphop_mobile_mp3',                         genre: 'Hip Hop' },
  news:        { name: '📰 BBC World Service',   url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',         genre: 'News / Talk' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Play a radio station in your voice channel')
    .addStringOption(o =>
      o.setName('station')
        .setDescription('Radio station to play')
        .setRequired(true)
        .addChoices(
          { name: '🎧 Lo-Fi Hip Hop',      value: 'lofi'      },
          { name: '🎺 Jazz24',              value: 'jazz'      },
          { name: '🎻 Classic FM',          value: 'classical' },
          { name: '📻 1.FM Top 40',         value: 'pop'       },
          { name: '🎸 Radio Paradise Rock', value: 'rock'      },
          { name: '⚡ EDM / Trance',        value: 'edm'       },
          { name: '🎤 R&B / Soul',          value: 'rnb'       },
          { name: '🤠 Country',             value: 'country'   },
          { name: '🎵 Hip Hop',             value: 'hiphop'    },
          { name: '📰 BBC World Service',   value: 'news'      },
          { name: '🔗 Custom URL',          value: 'custom'    },
        )),
  category: 'Music',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const stationKey = interaction.options.getString('station', true);
    const guild = interaction.guild;
    const member = interaction.member as any;

    if (!guild) return;

    const voiceChannelId = member?.voice?.channelId as string | null;
    if (!voiceChannelId) {
      return interaction.reply({ content: '❌ You need to be in a voice channel to play radio.', ephemeral: true });
    }

    let station: { name: string; url: string; genre: string };

    if (stationKey === 'custom') {
      return interaction.reply({
        content: '🔗 To play a custom stream URL, use `/play <stream-url>` directly with a direct MP3/AAC stream URL.',
        ephemeral: true,
      });
    }

    station = RADIO_STATIONS[stationKey];
    if (!station) {
      return interaction.reply({ content: '❌ Unknown station.', ephemeral: true });
    }

    const client = interaction.client as any;

    // Use Lavalink if available
    if (client.lavalink) {
      await interaction.deferReply();

      let player = client.lavalink.getPlayer(guild.id);
      if (!player) {
        player = client.lavalink.createPlayer({
          guildId: guild.id,
          voiceChannelId,
          textChannelId: interaction.channelId,
          selfDeaf: true,
          selfMute: false,
          volume: 80,
        });
      }

      if (!player.connected) await player.connect();

      const result = await player.search(
        { query: station.url, source: 'http' },
        interaction.client.user!,
      ).catch(() => null);

      if (!result || result.loadType === 'empty' || result.loadType === 'error') {
        return interaction.editReply({ content: `❌ Failed to load **${station.name}** stream. The station may be temporarily unavailable.` });
      }

      const track = result.tracks[0];
      player.queue.add(track);
      if (!player.playing) await player.play().catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle('📻 Radio Station Playing')
        .setColor('#5865F2')
        .addFields(
          { name: '🎵 Station', value: station.name, inline: true },
          { name: '🎼 Genre', value: station.genre, inline: true },
          { name: '🔊 Voice Channel', value: `<#${voiceChannelId}>`, inline: true },
        )
        .setFooter({ text: 'Use /stop to end playback' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // Fallback if Lavalink not configured
    const embed = new EmbedBuilder()
      .setTitle('📻 Radio Station')
      .setColor('#FF9900')
      .setDescription(`**${station.name}** (${station.genre})\n\n⚠️ Music (Lavalink) is not configured on this bot instance. To enable radio, set up Lavalink with \`LAVALINK_HOST\`, \`LAVALINK_PORT\`, and \`LAVALINK_PASSWORD\`.`)
      .addFields({ name: '🔗 Stream URL', value: `\`${station.url}\``, inline: false })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
