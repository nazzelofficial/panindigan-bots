import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "lyrics",
  description: "Find lyrics ng current track o ng ibang track",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["lyric"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("song").setDescription("Pangalan ng track (kung wala: gagamitin ang current track)").setRequired(false),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    const player = lava?.getPlayer?.(guild.id);

    const songQuery = ctx.isSlash
      ? ctx.interaction!.options.getString("song")
      : ctx.args.join(" ") || null;

    const currentTitle: string | null =
      player?.queue?.current?.info?.title ??
      player?.current?.title ??
      null;

    const query = songQuery ?? currentTitle;
    if (!query) {
      await ctx.reply({ embeds: [infoEmbed("No track is playing and no song name was provided. Use `/lyrics [song]`.")] });
      return;
    }

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    try {
      // Attempt lyrics search via lyrics.ovh (free, no key)
      const encoded = encodeURIComponent(query);
      const res = await fetch(`https://api.lyrics.ovh/suggest/${encoded}`, {
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as { data?: { title: string; artist: { name: string } }[] };
      const match = data.data?.[0];

      if (!match) {
        await ctx.reply({ embeds: [errorEmbed(`No lyrics found for: **${query}**\n\nTry searching with the exact track title.`)] });
        return;
      }

      // Fetch actual lyrics
      const lyricsRes = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(match.artist.name)}/${encodeURIComponent(match.title)}`,
        { signal: AbortSignal.timeout(8_000) },
      );

      if (!lyricsRes.ok) throw new Error(`Lyrics fetch: HTTP ${lyricsRes.status}`);
      const lyricsData = (await lyricsRes.json()) as { lyrics?: string; error?: string };

      if (lyricsData.error || !lyricsData.lyrics) {
        await ctx.reply({
          embeds: [infoEmbed(`Nahanap ang track **${match.title}** ng **${match.artist.name}** pero walang available na lyrics.\n\nMaaaring copyright-protected ang track.`)],
        });
        return;
      }

      const lyrics = lyricsData.lyrics.trim();
      const MAX_LEN = 3900;
      const truncated = lyrics.length > MAX_LEN ? lyrics.slice(0, MAX_LEN) + "\n\n*... (truncated)*" : lyrics;

      const embed = baseEmbed("primary")
        .setTitle(`🎵 ${match.title}`)
        .setDescription(truncated)
        .setAuthor({ name: match.artist.name })
        .setFooter({ text: "Source: lyrics.ovh" });

      await ctx.reply({ embeds: [embed] });
    } catch (err) {
      await ctx.reply({
        embeds: [errorEmbed(`Hindi mahanap ang lyrics para sa: **${query}**\n\nSubukan ulit mamaya o magbigay ng mas tiyak na titulo.`)],
      });
    }
  },
};

export default command;
