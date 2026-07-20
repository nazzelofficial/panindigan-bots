import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
// ─── Source Color Mapping ─────────────────────────────────────────────────────
const SOURCE_COLORS = {
    youtube: 0xFF0000,
    spotify: 0x1DB954,
    soundcloud: 0xFF5500,
    applemusic: 0xFA243C,
    bandcamp: 0x629AA9,
    deezer: 0x00C7FA,
    twitch: 0x9146FF,
    vimeo: 0x1AB7EA,
    http: 0x5865F2,
    local: 0x99AAB5,
};
// ─── Progress Bar Component ───────────────────────────────────────────────────
export function createProgressBar(current, total, length = 20) {
    if (total === 0)
        return "▬".repeat(length);
    const progress = Math.min(Math.max(current / total, 0), 1);
    const filled = Math.round(progress * length);
    const empty = length - filled;
    return "━".repeat(filled) + "●" + "─".repeat(empty);
}
// ─── Metadata Resolver ───────────────────────────────────────────────────────
export function resolveMetadata(track) {
    const info = track.info;
    // Title fallback
    const title = info.title?.trim() || "Unknown Track";
    // Artist fallback - try multiple sources
    let artist = info.author?.trim() || "Artist unavailable";
    // Album fallback
    const album = null; // Lavalink doesn't provide album info in standard TrackInfo
    // Artwork fallback - try multiple sources
    const artwork = info.artworkUrl?.trim() ||
        "https://cdn.discordapp.com/embed/avatars/0.png";
    // Duration formatting
    const duration = info.isStream
        ? "🔴 LIVE"
        : formatDuration(info.duration || 0);
    // Source detection
    const source = info.sourceName?.toLowerCase() || "unknown";
    // Flags
    const isStream = info.isStream || false;
    const isExplicit = false; // Lavalink doesn't provide this, would need external API
    const isVerified = false; // Lavalink doesn't provide this, would need external API
    return { title, artist, album, artwork, duration, source, isStream, isExplicit, isVerified };
}
// ─── Duration Formatter ───────────────────────────────────────────────────────
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
// ─── Now Playing Embed ────────────────────────────────────────────────────────
export function createNowPlayingEmbed(queue, track, position) {
    const metadata = resolveMetadata(track);
    const color = SOURCE_COLORS[metadata.source] || 0x5865F2;
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle("🎵 Now Playing")
        .setDescription(`**${metadata.title}**`)
        .setThumbnail(metadata.artwork)
        .addFields({ name: "Artist", value: metadata.artist, inline: true }, { name: "Duration", value: metadata.duration, inline: true }, { name: "Source", value: metadata.source.charAt(0).toUpperCase() + metadata.source.slice(1), inline: true })
        .addFields({
        name: "Progress",
        value: `${createProgressBar(position, track.info.duration || 0)}\n\`${formatDuration(position)} / ${metadata.duration}\``,
        inline: false
    });
    // Add badges
    const badges = [];
    if (metadata.isStream)
        badges.push("🔴 Live");
    if (metadata.isExplicit)
        badges.push("🔞 Explicit");
    if (metadata.isVerified)
        badges.push("✓ Verified");
    if (badges.length > 0) {
        embed.addFields({ name: "Badges", value: badges.join(" • "), inline: true });
    }
    // Add queue info
    const queueSize = queue.tracks.length;
    const queueDuration = queue.tracks.reduce((acc, t) => acc + (t.info.duration || 0), 0);
    embed.addFields({ name: "Queue Position", value: "1 (Current)", inline: true }, { name: "Queue Size", value: queueSize > 0 ? `${queueSize} songs` : "Empty", inline: true }, { name: "Remaining", value: queueSize > 0 ? formatDuration(queueDuration) : "None", inline: true });
    // Add requester
    if (track.requester) {
        embed.addFields({ name: "Requested by", value: `<@${track.requester}>`, inline: true });
    }
    embed.setTimestamp();
    return embed;
}
// ─── Track Started Embed ───────────────────────────────────────────────────────
export function createTrackStartedEmbed(track) {
    const metadata = resolveMetadata(track);
    const color = SOURCE_COLORS[metadata.source] || 0x5865F2;
    return new EmbedBuilder()
        .setColor(color)
        .setTitle("▶️ Track Started")
        .setDescription(`**${metadata.title}**`)
        .setThumbnail(metadata.artwork)
        .addFields({ name: "Artist", value: metadata.artist, inline: true }, { name: "Duration", value: metadata.duration, inline: true })
        .setTimestamp();
}
// ─── Track Finished Embed ──────────────────────────────────────────────────────
export function createTrackFinishedEmbed(track) {
    const metadata = resolveMetadata(track);
    const color = SOURCE_COLORS[metadata.source] || 0x5865F2;
    return new EmbedBuilder()
        .setColor(color)
        .setTitle("⏹️ Track Finished")
        .setDescription(`**${metadata.title}**`)
        .setThumbnail(metadata.artwork)
        .addFields({ name: "Artist", value: metadata.artist, inline: true }, { name: "Duration", value: metadata.duration, inline: true })
        .setTimestamp();
}
// ─── Auto-Playing Next Embed ───────────────────────────────────────────────────
export function createAutoPlayingNextEmbed(track) {
    const metadata = resolveMetadata(track);
    const color = SOURCE_COLORS[metadata.source] || 0x5865F2;
    return new EmbedBuilder()
        .setColor(color)
        .setTitle("🔄 Auto-Playing Next")
        .setDescription(`**${metadata.title}**`)
        .setThumbnail(metadata.artwork)
        .addFields({ name: "Artist", value: metadata.artist, inline: true }, { name: "Duration", value: metadata.duration, inline: true })
        .setTimestamp();
}
// ─── Queue Finished Embed ──────────────────────────────────────────────────────
export function createQueueFinishedEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎵 Queue Finished")
        .setDescription("All songs have finished playing.\n\nThank you for listening!")
        .addFields({ name: "Status", value: "Leaving voice channel in 30 seconds...", inline: false })
        .setTimestamp();
}
// ─── Autoplay Started Embed ────────────────────────────────────────────────────
export function createAutoplayStartedEmbed() {
    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎵 Autoplay Started")
        .setDescription("Similar tracks will be automatically added to the queue.")
        .setTimestamp();
}
// ─── Disconnected Embed ────────────────────────────────────────────────────────
export function createDisconnectedEmbed() {
    return new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle("🔌 Disconnected")
        .setDescription("The bot has been disconnected from the voice channel.")
        .setTimestamp();
}
// ─── Reconnecting Embed ────────────────────────────────────────────────────────
export function createReconnectingEmbed() {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🔄 Reconnecting")
        .setDescription("Attempting to reconnect to the voice channel...")
        .setTimestamp();
}
// ─── Node Restored Embed ────────────────────────────────────────────────────────
export function createNodeRestoredEmbed(nodeName) {
    return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("✅ Node Restored")
        .setDescription(`Lavalink node **${nodeName}** is back online.`)
        .setTimestamp();
}
// ─── Premium Button Row ────────────────────────────────────────────────────────
export function createMusicButtonRow(isPaused, loopMode, isShuffle) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder()
        .setCustomId("music:previous")
        .setLabel("⏮")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("music:pause")
        .setLabel(isPaused ? "▶️" : "⏸")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId("music:skip")
        .setLabel("⏭")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId("music:stop")
        .setLabel("⏹")
        .setStyle(ButtonStyle.Danger), new ButtonBuilder()
        .setCustomId("music:shuffle")
        .setLabel(isShuffle ? "🔀" : "🔀")
        .setStyle(loopMode !== "off" ? ButtonStyle.Success : ButtonStyle.Secondary));
    return row;
}
// ─── Queue Embed ──────────────────────────────────────────────────────────────
export function createQueueEmbed(queue, page = 1, perPage = 10) {
    const currentTrack = queue.current;
    const tracks = queue.tracks;
    const totalPages = Math.ceil(tracks.length / perPage) || 1;
    const startIdx = (page - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, tracks.length);
    const pageTracks = tracks.slice(startIdx, endIdx);
    // Calculate total duration
    const totalDuration = tracks.reduce((acc, t) => acc + (t.info.duration || 0), 0);
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("📜 Music Queue")
        .setDescription(`Total: **${tracks.length}** songs | Duration: **${formatDuration(totalDuration)}**`)
        .setTimestamp();
    // Current track
    if (currentTrack) {
        const currentMetadata = resolveMetadata(currentTrack);
        embed.addFields({
            name: "🎵 Now Playing",
            value: `**${currentMetadata.title}**\n${currentMetadata.artist} • ${currentMetadata.duration}`,
            inline: false,
        });
    }
    // Up next
    if (pageTracks.length > 0) {
        const queueList = pageTracks.map((track, idx) => {
            const metadata = resolveMetadata(track);
            const position = startIdx + idx + 1;
            const requester = track.requester ? `<@${track.requester}>` : "Unknown";
            return `${position}. **${metadata.title}**\n   ${metadata.artist} • ${metadata.duration} • ${requester}`;
        }).join("\n\n");
        embed.addFields({
            name: `📋 Up Next (Page ${page}/${totalPages})`,
            value: queueList || "No songs in queue",
            inline: false,
        });
    }
    else {
        embed.addFields({
            name: "📋 Up Next",
            value: "No songs in queue",
            inline: false,
        });
    }
    // Footer with navigation hint
    if (totalPages > 1) {
        embed.setFooter({ text: `Use the buttons below to navigate • Page ${page} of ${totalPages}` });
    }
    return embed;
}
// ─── Queue Navigation Buttons ─────────────────────────────────────────────────
export function createQueueNavigationButtons(page, totalPages) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder()
        .setCustomId("queue:first")
        .setLabel("⏮ First")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1), new ButtonBuilder()
        .setCustomId("queue:previous")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1), new ButtonBuilder()
        .setCustomId("queue:next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages), new ButtonBuilder()
        .setCustomId("queue:last")
        .setLabel("Last ⏭")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages));
    return row;
}
// ─── Search Results Embed ───────────────────────────────────────────────────────
export function createSearchResultsEmbed(query, tracks, page = 1, perPage = 5) {
    const totalPages = Math.ceil(tracks.length / perPage) || 1;
    const startIdx = (page - 1) * perPage;
    const endIdx = Math.min(startIdx + perPage, tracks.length);
    const pageTracks = tracks.slice(startIdx, endIdx);
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🔍 Search Results")
        .setDescription(`Query: **${query}**\nFound **${tracks.length}** results`)
        .setTimestamp();
    if (pageTracks.length > 0) {
        const results = pageTracks.map((track, idx) => {
            const metadata = resolveMetadata(track);
            const position = startIdx + idx + 1;
            return `**${position}.** ${metadata.title}\n   ${metadata.artist} • ${metadata.duration} • ${metadata.source.charAt(0).toUpperCase() + metadata.source.slice(1)}`;
        }).join("\n\n");
        embed.addFields({
            name: `Results (Page ${page}/${totalPages})`,
            value: results,
            inline: false,
        });
    }
    embed.setFooter({ text: "Select a number to play, or use buttons to navigate" });
    return embed;
}
export function createSearchNavigationButtons(page, totalPages) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder()
        .setCustomId("search:previous")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1), new ButtonBuilder()
        .setCustomId("search:next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages), new ButtonBuilder()
        .setCustomId("search:cancel")
        .setLabel("❌ Cancel")
        .setStyle(ButtonStyle.Danger));
    return row;
}
// ─── Lyrics Embed ──────────────────────────────────────────────────────────────
export function createLyricsEmbed(title, artist, lyrics, page = 1, totalPages = 1) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎤 Lyrics")
        .setDescription(`**${title}** by ${artist}`)
        .setTimestamp();
    embed.addFields({
        name: `Lyrics (Page ${page}/${totalPages})`,
        value: lyrics.slice(0, 4000) || "Lyrics not available",
        inline: false,
    });
    embed.setFooter({ text: "Source: Genius • Use buttons to navigate if paginated" });
    return embed;
}
export function createLyricsNavigationButtons(page, totalPages) {
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder()
        .setCustomId("lyrics:previous")
        .setLabel("◀ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1), new ButtonBuilder()
        .setCustomId("lyrics:next")
        .setLabel("Next ▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages), new ButtonBuilder()
        .setCustomId("lyrics:close")
        .setLabel("❌ Close")
        .setStyle(ButtonStyle.Danger));
    return row;
}
// ─── Playlist Loading Embed ────────────────────────────────────────────────────
export function createPlaylistLoadingEmbed(playlistName, artwork, loaded, total) {
    const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const progressBar = createProgressBar(loaded, total, 20);
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("📂 Loading Playlist")
        .setDescription(`**${playlistName}**`)
        .setThumbnail(artwork)
        .addFields({ name: "Progress", value: `${progressBar} ${progress}%`, inline: false }, { name: "Loaded", value: `${loaded} / ${total} songs`, inline: true }, { name: "Status", value: "Processing...", inline: true })
        .setTimestamp();
}
export function createPlaylistLoadedEmbed(playlistName, artwork, loaded, totalDuration) {
    return new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle("✅ Playlist Loaded")
        .setDescription(`**${playlistName}**`)
        .setThumbnail(artwork)
        .addFields({ name: "Songs Imported", value: `${loaded} songs`, inline: true }, { name: "Total Duration", value: formatDuration(totalDuration), inline: true }, { name: "Status", value: "Ready to play", inline: true })
        .setTimestamp();
}
// ─── Filter UI Embed ────────────────────────────────────────────────────────────
export function createFilterUIEmbed(activeFilters) {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎛 Audio Filters")
        .setDescription("Select a filter to toggle it on or off")
        .setTimestamp();
    const filterList = [
        { name: "Bass Boost", emoji: "🔊", status: activeFilters.includes("bassboost") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Nightcore", emoji: "🌙", status: activeFilters.includes("nightcore") ? "✅ Enabled" : "❌ Disabled" },
        { name: "8D Audio", emoji: "🎧", status: activeFilters.includes("8d") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Vaporwave", emoji: "🌫", status: activeFilters.includes("vaporwave") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Karaoke", emoji: "🎤", status: activeFilters.includes("karaoke") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Treble Boost", emoji: "🔔", status: activeFilters.includes("treble") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Speed Up", emoji: "⏩", status: activeFilters.includes("speed") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Pitch Shift", emoji: "🎼", status: activeFilters.includes("pitch") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Rotation", emoji: "🔄", status: activeFilters.includes("rotation") ? "✅ Enabled" : "❌ Disabled" },
        { name: "Low Pass", emoji: "📉", status: activeFilters.includes("lowpass") ? "✅ Enabled" : "❌ Disabled" },
    ];
    const filterFields = filterList.map(f => `${f.emoji} **${f.name}** - ${f.status}`).join("\n");
    embed.addFields({
        name: "Available Filters",
        value: filterFields,
        inline: false,
    });
    if (activeFilters.length > 0) {
        embed.addFields({
            name: "Active Filters",
            value: activeFilters.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(", "),
            inline: false,
        });
    }
    else {
        embed.addFields({
            name: "Active Filters",
            value: "None",
            inline: false,
        });
    }
    return embed;
}
export function createFilterSelectMenu() {
    // This would be a StringSelectMenuBuilder, but for simplicity we'll use buttons
    const row = new ActionRowBuilder();
    row.addComponents(new ButtonBuilder()
        .setCustomId("filter:bassboost")
        .setLabel("🔊 Bass Boost")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("filter:nightcore")
        .setLabel("🌙 Nightcore")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("filter:8d")
        .setLabel("🎧 8D")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("filter:vaporwave")
        .setLabel("🌫 Vaporwave")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId("filter:clear")
        .setLabel("🗑 Clear All")
        .setStyle(ButtonStyle.Danger));
    return row;
}
// ─── Helper: Format Number ─────────────────────────────────────────────────────
function formatNumber(num) {
    if (num >= 1000000)
        return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000)
        return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}
// ─── Loading State Embeds ──────────────────────────────────────────────────────
export function createSearchingEmbed(query) {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🔍 Searching...")
        .setDescription(`Looking for: **${query}**`)
        .addFields({ name: "Status", value: "Searching across platforms...", inline: false })
        .setTimestamp();
}
export function createResolvingEmbed(track) {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("⏳ Resolving...")
        .setDescription(`Resolving track: **${track}**`)
        .addFields({ name: "Status", value: "Fetching audio source...", inline: false })
        .setTimestamp();
}
export function createLoadingPlaylistEmbed(playlistName) {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("📂 Loading Playlist...")
        .setDescription(`**${playlistName}**`)
        .addFields({ name: "Status", value: "Fetching playlist information...", inline: false })
        .setTimestamp();
}
export function createConnectingEmbed() {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("🔌 Connecting...")
        .setDescription("Connecting to voice channel...")
        .addFields({ name: "Status", value: "Establishing voice connection...", inline: false })
        .setTimestamp();
}
export function createBufferingEmbed() {
    return new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle("⏳ Buffering...")
        .setDescription("Buffering audio...")
        .addFields({ name: "Status", value: "Preloading audio for smooth playback...", inline: false })
        .setTimestamp();
}
//# sourceMappingURL=musicEmbeds.js.map