import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

interface LyricsOvhSuggestResult {
  data: Array<{ artist: { name: string }; title: string }>;
}

interface LyricsOvhResult {
  lyrics?: string;
  error?: string;
}

async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as LyricsOvhResult;
    return data.lyrics ?? null;
  } catch {
    return null;
  }
}

async function searchLyrics(query: string): Promise<{ artist: string; title: string; lyrics: string } | null> {
  try {
    const suggestUrl = `https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`;
    const res = await fetch(suggestUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as LyricsOvhSuggestResult;
    if (!data.data?.length) return null;

    // Try the first few results until we find one with lyrics
    for (const result of data.data.slice(0, 5)) {
      const artist = result.artist.name;
      const title = result.title;
      const lyrics = await fetchLyrics(artist, title);
      if (lyrics) return { artist, title, lyrics };
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('lyricssearch')
    .setDescription('Search for song lyrics')
    .addStringOption(o =>
      o.setName('query').setDescription('Song name or "Artist - Song" (e.g. "Ed Sheeran - Shape of You")').setRequired(true)),
  category: 'Music',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query', true);
    await interaction.deferReply();

    const result = await searchLyrics(query);

    if (!result) {
      return interaction.editReply({
        content: `❌ No lyrics found for **${query}**.\n• Try a more specific query like \`Artist - Song Title\`\n• Lyrics are provided by [lyrics.ovh](https://lyrics.ovh)`,
      });
    }

    const { artist, title, lyrics } = result;

    // Truncate lyrics to Discord embed limits
    const maxLen = 3900;
    const truncated = lyrics.length > maxLen;
    const displayLyrics = truncated ? lyrics.slice(0, maxLen) + '\n\n*[Lyrics truncated — full version attached as file]*' : lyrics;

    const embed = new EmbedBuilder()
      .setTitle(`🎵 ${title}`)
      .setColor('#5865F2')
      .setDescription(displayLyrics)
      .setFooter({ text: `Artist: ${artist} • Powered by lyrics.ovh` })
      .setTimestamp();

    const files: AttachmentBuilder[] = [];
    if (truncated) {
      const buffer = Buffer.from(`${title} — ${artist}\n\n${lyrics}`, 'utf-8');
      files.push(new AttachmentBuilder(buffer, { name: `lyrics_${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt` }));
    }

    return interaction.editReply({ embeds: [embed], files });
  },
} as unknown as CommandDefinition;
