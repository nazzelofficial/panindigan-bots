import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { createSearchingEmbed, createPlaylistLoadingEmbed, createPlaylistLoadedEmbed, } from "../../features/music/embeds/musicEmbeds.js";
function getMusicUnavailableEmbed() {
    return errorEmbed("❌ Music service is currently unavailable.\nThe Lavalink server is offline or unreachable.\nPlease try again later.");
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
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [errorEmbed(validationError)] });
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
        const textChannel = ctx.client.channels.cache.get(textChannelId);
        // Store the bot's message for editing (for prefix commands)
        let botMessage = null;
        const botUserId = ctx.client.user?.id;
        if (!botUserId) {
            await ctx.reply({ embeds: [errorEmbed("Bot user not available.")] });
            return;
        }
        // Send searching embed - different logic for slash vs prefix
        if (ctx.isSlash) {
            await ctx.interaction.deferReply();
        }
        else {
            // For prefix commands, reply with searching embed and store the message
            botMessage = await ctx.message.reply({ embeds: [createSearchingEmbed(query)] });
        }
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
            result = await player.search({ query, source: "ytsearch" }, { id: botUserId, username: "bot" });
        }
        catch (error) {
            const errorEmbedMsg = errorEmbed("❌ Music service unavailable — could not search for that track. Try again shortly.");
            if (ctx.isSlash) {
                await ctx.interaction.editReply({ embeds: [errorEmbedMsg] });
            }
            else if (botMessage && botMessage.author.id === botUserId) {
                await botMessage.edit({ embeds: [errorEmbedMsg] });
            }
            else {
                await ctx.message.reply({ embeds: [errorEmbedMsg] });
            }
            return;
        }
        if (!result || result.loadType === "empty" || result.loadType === "error") {
            const errorEmbedMsg = errorEmbed("No results found for your query.");
            if (ctx.isSlash) {
                await ctx.interaction.editReply({ embeds: [errorEmbedMsg] });
            }
            else if (botMessage && botMessage.author.id === botUserId) {
                await botMessage.edit({ embeds: [errorEmbedMsg] });
            }
            else {
                await ctx.message.reply({ embeds: [errorEmbedMsg] });
            }
            return;
        }
        if (result.loadType === "playlist") {
            // Send loading embed
            const loadingEmbed = createPlaylistLoadingEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", 0, result.tracks.length);
            if (ctx.isSlash) {
                await ctx.interaction.editReply({ embeds: [loadingEmbed] });
            }
            else if (botMessage && botMessage.author.id === botUserId) {
                await botMessage.edit({ embeds: [loadingEmbed] });
            }
            else {
                await ctx.message.reply({ embeds: [loadingEmbed] });
            }
            for (const track of result.tracks) {
                track.requester = ctx.userId;
                player.queue.add(track);
            }
            const totalDuration = result.tracks.reduce((acc, t) => acc + (t.info.duration || 0), 0);
            const loadedEmbed = createPlaylistLoadedEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", result.tracks.length, totalDuration);
            if (ctx.isSlash) {
                await ctx.interaction.editReply({ embeds: [loadedEmbed] });
            }
            else if (botMessage && botMessage.author.id === botUserId) {
                await botMessage.edit({ embeds: [loadedEmbed] });
            }
            else {
                await ctx.message.reply({ embeds: [loadedEmbed] });
            }
            if (!player.playing)
                await player.play().catch(() => { });
        }
        else {
            const track = result.tracks[0];
            track.requester = ctx.userId;
            player.queue.add(track);
            if (!player.playing) {
                await player.play().catch(() => { });
                // Controller will be updated by trackStart event
                const nowPlayingEmbed = errorEmbed(`▶️ Now Playing\n**${track.info.title}**\nRequested by <@${ctx.userId}>`).setThumbnail(track.info.artworkUrl ?? null);
                if (ctx.isSlash) {
                    await ctx.interaction.editReply({ embeds: [nowPlayingEmbed] });
                }
                else if (botMessage && botMessage.author.id === botUserId) {
                    await botMessage.edit({ embeds: [nowPlayingEmbed] });
                }
                else {
                    await ctx.message.reply({ embeds: [nowPlayingEmbed] });
                }
            }
            else {
                const pos = player.queue.tracks.length;
                const queueEmbed = errorEmbed(`➕ Added to queue at position #${pos}\n**${track.info.title}**\nRequested by <@${ctx.userId}>`).setThumbnail(track.info.artworkUrl ?? null);
                if (ctx.isSlash) {
                    await ctx.interaction.editReply({ embeds: [queueEmbed] });
                }
                else if (botMessage && botMessage.author.id === botUserId) {
                    await botMessage.edit({ embeds: [queueEmbed] });
                }
                else {
                    await ctx.message.reply({ embeds: [queueEmbed] });
                }
            }
        }
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