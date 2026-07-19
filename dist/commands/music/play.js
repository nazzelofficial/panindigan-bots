import { baseEmbed, errorEmbed } from "@/utils/embeds";
function getMusicNotConfiguredEmbed() {
    return errorEmbed("Music isn't configured on this bot yet — set `LAVALINK_HOST`, `LAVALINK_PORT`, and `LAVALINK_PASSWORD` in your environment.");
}
const command = {
    name: "play",
    description: "Play a song or playlist from a URL or search query",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["p"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("query").setDescription("Song name or URL").setRequired(true).setAutocomplete(true)),
    async autocomplete(interaction, client) {
        const query = String(interaction.options.getFocused() ?? "").trim();
        if (!query || query.length < 2) {
            await interaction.respond([{ name: "Type a song name or URL to search…", value: "lofi chill beats" }]);
            return;
        }
        const lava = client.lavalink;
        if (!lava) {
            await interaction.respond([]);
            return;
        }
        try {
            // lavalink-client exposes search on the manager directly
            const result = await (lava.search
                ? lava.search({ query, source: "ytsearch" }, client.user)
                : lava.getPlayer(interaction.guildId)?.search?.({ query, source: "ytsearch" }, client.user)).catch(() => null);
            const tracks = result?.tracks ?? [];
            await interaction.respond(tracks.slice(0, 10).map((t) => ({
                name: `${t.info.title} — ${t.info.author}`.slice(0, 100),
                value: (t.info.uri ?? t.info.title).slice(0, 100),
            })));
        }
        catch {
            await interaction.respond([]);
        }
    },
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [getMusicNotConfiguredEmbed()] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        const member = ctx.interaction?.member ?? ctx.message?.member;
        if (!guild || !member)
            return;
        const voiceChannelId = member.voice?.channelId;
        if (!voiceChannelId) {
            await ctx.reply({ embeds: [errorEmbed("You need to be in a voice channel to use music commands.")] });
            return;
        }
        const query = ctx.isSlash ? ctx.interaction.options.getString("query", true) : ctx.args.join(" ");
        if (!query) {
            await ctx.reply({ embeds: [errorEmbed("Provide a song name or URL.")] });
            return;
        }
        const textChannelId = ctx.interaction?.channelId ?? ctx.message?.channelId;
        let player = ctx.client.lavalink.getPlayer(guild.id);
        if (!player) {
            player = ctx.client.lavalink.createPlayer({
                guildId: guild.id,
                voiceChannelId,
                textChannelId,
                selfDeaf: true,
                selfMute: false,
                volume: 80,
            });
        }
        if (!player.connected)
            await player.connect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let result = null;
        try {
            result = await player.search({ query, source: "ytsearch" }, ctx.client.user);
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed("❌ Music service unavailable — could not search for that track. Try again shortly.")] });
            return;
        }
        if (!result || result.loadType === "empty" || result.loadType === "error") {
            await ctx.reply({ embeds: [errorEmbed("No results found for your query.")] });
            return;
        }
        if (result.loadType === "playlist") {
            for (const track of result.tracks)
                player.queue.add(track);
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle("📋 Playlist Added")
                        .setDescription(`Added **${result.tracks.length}** tracks from **${result.playlist?.name ?? "playlist"}** to the queue.`),
                ],
            });
        }
        else {
            const track = result.tracks[0];
            player.queue.add(track);
            if (!player.playing) {
                await ctx.reply({
                    embeds: [
                        baseEmbed("primary")
                            .setTitle("▶️ Now Playing")
                            .setDescription(`[${track.info.title}](${track.info.uri})`)
                            .addFields({ name: "Author", value: track.info.author ?? "Unknown", inline: true }, { name: "Duration", value: track.info.isStream ? "🔴 Live" : formatDuration(track.info.duration ?? 0), inline: true }, { name: "Requested by", value: `<@${ctx.userId}>`, inline: true })
                            .setThumbnail(track.info.artworkUrl ?? null),
                    ],
                });
            }
            else {
                const pos = player.queue.tracks.length;
                await ctx.reply({
                    embeds: [
                        baseEmbed("primary")
                            .setTitle("➕ Added to Queue")
                            .setDescription(`[${track.info.title}](${track.info.uri})`)
                            .addFields({ name: "Position", value: `#${pos}`, inline: true })
                            .setThumbnail(track.info.artworkUrl ?? null),
                    ],
                });
            }
        }
        if (!player.playing)
            await player.play().catch(() => { });
    },
};
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0
        ? `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
        : `${m}:${String(s % 60).padStart(2, "0")}`;
}
export default command;
//# sourceMappingURL=play.js.map