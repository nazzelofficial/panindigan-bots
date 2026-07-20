import { errorEmbed } from "../../utils/embeds.js";
import { createLyricsEmbed, createLyricsNavigationButtons } from "../../features/music/embeds/musicEmbeds.js";
const command = {
    name: "lyrics",
    description: "Find lyrics ng current track o ng ibang track",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["lyric"],
    slashData: (b) => b.addStringOption((o) => o.setName("song").setDescription("Pangalan ng track (kung wala: gagamitin ang current track)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const lava = ctx.client.lavalink;
        const player = lava?.getPlayer?.(guild.id);
        const songQuery = ctx.isSlash
            ? ctx.interaction.options.getString("song")
            : ctx.args.join(" ") || null;
        const currentTitle = player?.queue?.current?.info?.title ??
            player?.current?.title ??
            null;
        const query = songQuery ?? currentTitle;
        if (!query) {
            await ctx.reply({ embeds: [errorEmbed("No track is playing and no song name was provided. Use `/lyrics [song]`.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            // Attempt lyrics search via lyrics.ovh (free, no key)
            const encoded = encodeURIComponent(query);
            const res = await fetch(`https://api.lyrics.ovh/suggest/${encoded}`, {
                signal: AbortSignal.timeout(8_000),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = (await res.json());
            const match = data.data?.[0];
            if (!match) {
                await ctx.reply({ embeds: [errorEmbed(`No lyrics found for: **${query}**\n\nTry searching with the exact track title.`)] });
                return;
            }
            // Fetch actual lyrics
            const lyricsRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(match.artist.name)}/${encodeURIComponent(match.title)}`, { signal: AbortSignal.timeout(8_000) });
            if (!lyricsRes.ok)
                throw new Error(`Lyrics fetch: HTTP ${lyricsRes.status}`);
            const lyricsData = (await lyricsRes.json());
            if (lyricsData.error || !lyricsData.lyrics) {
                await ctx.reply({
                    embeds: [errorEmbed(`Nahanap ang track **${match.title}** ng **${match.artist.name}** pero walang available na lyrics.\n\nMaaaring copyright-protected ang track.`)],
                });
                return;
            }
            const lyrics = lyricsData.lyrics.trim();
            const MAX_LEN = 3900;
            const truncated = lyrics.length > MAX_LEN ? lyrics.slice(0, MAX_LEN) + "\n\n*... (truncated)*" : lyrics;
            const embed = createLyricsEmbed(match.title, match.artist.name, truncated, 1);
            const buttons = createLyricsNavigationButtons(1, 1);
            await ctx.reply({ embeds: [embed], components: buttons ? [buttons] : [] });
        }
        catch (err) {
            await ctx.reply({
                embeds: [errorEmbed(`Hindi mahanap ang lyrics para sa: **${query}**\n\nSubukan ulit mamaya o magbigay ng mas tiyak na titulo.`)],
            });
        }
    },
};
export default command;
//# sourceMappingURL=lyrics.js.map