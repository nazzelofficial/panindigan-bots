/**
 * features/music/musicDashboard.ts v0.2.6
 * Music Dashboard — Now Playing display with controls and queue management
 *
 * v0.2.6 Music Dashboard Features:
 *   🎵 Now Playing Display — album artwork, requester info, live progress bar
 *   📋 Queue Management — view, reorder, remove tracks
 *   🔘 Playback Controls — play, pause, skip, previous, stop, shuffle, loop
 *   🔊 Volume Control — slider with visual feedback
 *   🎛️ Audio Filters — bassboost, nightcore, vaporwave, etc.
 *   🔮 Smart Recommendations — based on current queue
 *   📁 Playlist Management — save, load, share playlists
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, } from "discord.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { CUSTOM_ID } from "../../constants/index.js";
// ── Progress bar generator ───────────────────────────────────────────────────────
/**
 * Generate a visual progress bar for the current track.
 * @param position Current position in milliseconds
 * @param duration Total duration in milliseconds
 * @param length Total length of the progress bar (default 20)
 */
export function generateProgressBar(position, duration, length = 20) {
    const progress = Math.min(1, Math.max(0, position / duration));
    const filled = Math.round(progress * length);
    const empty = length - filled;
    const filledBar = "█".repeat(filled);
    const emptyBar = "░".repeat(empty);
    return `${filledBar}${emptyBar}`;
}
/**
 * Format duration in milliseconds to MM:SS format.
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
/**
 * Format duration to human-readable string (e.g., "3:45" or "1:23:45").
 */
export function formatDurationHuman(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
// ── Now Playing embed builder ─────────────────────────────────────────────────────
/**
 * Build the Now Playing embed with all relevant information.
 */
export function buildNowPlayingEmbed(state) {
    const { nowPlaying, volume, loopMode, isShuffled, isPaused, queue } = state;
    if (!nowPlaying) {
        return EmbedFactory.music("Walang naka-play na kanta ngayon.\n\nGamitin ang `/play` para mag-queue ng kanta!", "🎵 Now Playing");
    }
    const progressBar = generateProgressBar(nowPlaying.position, nowPlaying.duration);
    const positionStr = formatDuration(nowPlaying.position);
    const durationStr = formatDuration(nowPlaying.duration);
    const sourceIcon = nowPlaying.source === "spotify" ? "🎧" : nowPlaying.source === "soundcloud" ? "☁️" : "📺";
    const embed = EmbedFactory.music("", "🎵 Now Playing")
        .setTitle(`${sourceIcon} ${nowPlaying.title}`)
        .setDescription(`${nowPlaying.artist ? `**Artist:** ${nowPlaying.artist}\n` : ""}` +
        `**Progress:** \`${positionStr} / ${durationStr}\`\n` +
        `${progressBar} ${Math.round((nowPlaying.position / nowPlaying.duration) * 100)}%\n\n` +
        `🎙️ Requested by <@${nowPlaying.requester}>`)
        .addFields({ name: "🔊 Volume", value: `${volume}%`, inline: true }, { name: "🔁 Loop", value: loopMode === "off" ? "Off" : loopMode === "track" ? "Track" : "Queue", inline: true }, { name: "🔀 Shuffle", value: isShuffled ? "On" : "Off", inline: true }, { name: "📋 Queue", value: `${queue.length} track${queue.length !== 1 ? "s" : ""}`, inline: true });
    if (nowPlaying.artworkUrl) {
        embed.setThumbnail(nowPlaying.artworkUrl);
    }
    if (nowPlaying.requesterAvatar) {
        embed.setFooter({
            text: `🤖 Panindigan Music · ${isPaused ? "⏸️ Paused" : "▶️ Playing"} · v0.2.6`,
            iconURL: nowPlaying.requesterAvatar,
        });
    }
    return embed;
}
// ── Queue embed builder ───────────────────────────────────────────────────────────
/**
 * Build the queue embed with paginated track list.
 */
export function buildQueueEmbed(state, page = 1, pageSize = 10) {
    const { queue, nowPlaying } = state;
    if (queue.length === 0 && !nowPlaying) {
        return EmbedFactory.music("Ang queue ay walang laman.\n\nGamitin ang `/play` para magdagdag ng kanta!", "📋 Music Queue");
    }
    const totalPages = Math.max(1, Math.ceil(queue.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, queue.length);
    const pageTracks = queue.slice(startIdx, endIdx);
    let description = "";
    if (nowPlaying) {
        const progressBar = generateProgressBar(nowPlaying.position, nowPlaying.duration);
        description += `▶️ **Now Playing:** ${nowPlaying.title}\n${progressBar} ${formatDuration(nowPlaying.position)}/${formatDuration(nowPlaying.duration)}\n\n`;
    }
    if (pageTracks.length > 0) {
        description += pageTracks
            .map((track, i) => {
            const num = startIdx + i + 1;
            return `\`${num}.\` **${track.title}**\n   🎙️ <@${track.requester}> · ${formatDurationHuman(track.duration)}`;
        })
            .join("\n\n");
    }
    const totalDuration = queue.reduce((acc, track) => acc + track.duration, 0);
    const embed = EmbedFactory.music(description || "Walang tracks sa queue.", "📋 Music Queue")
        .addFields({ name: "📊 Queue Stats", value: `${queue.length} track${queue.length !== 1 ? "s" : ""} · ${formatDurationHuman(totalDuration)} total`, inline: true }, { name: "📄 Page", value: `${currentPage}/${totalPages}`, inline: true });
    return embed;
}
// ── Control button builders ───────────────────────────────────────────────────────
/**
 * Build the main playback control buttons.
 */
export function buildPlaybackControls(state) {
    const { isPaused, loopMode, isShuffled } = state;
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_PREV)
        .setEmoji("⏮️")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_PAUSE)
        .setEmoji(isPaused ? "▶️" : "⏸️")
        .setLabel(isPaused ? "Resume" : "Pause")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_SKIP)
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Primary), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_STOP)
        .setEmoji("⏹️")
        .setStyle(ButtonStyle.Danger), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_SHUFFLE)
        .setEmoji("🔀")
        .setStyle(isShuffled ? ButtonStyle.Success : ButtonStyle.Secondary));
}
/**
 * Build secondary control buttons (loop, volume, etc.).
 */
export function buildSecondaryControls(state) {
    const { loopMode, volume } = state;
    const loopLabel = loopMode === "off" ? "Loop: Off" : loopMode === "track" ? "Loop: Track" : "Loop: Queue";
    const loopStyle = loopMode === "off" ? ButtonStyle.Secondary : ButtonStyle.Success;
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_LOOP)
        .setLabel(loopLabel)
        .setStyle(loopStyle), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_VOLUME)
        .setLabel(`🔊 ${volume}%`)
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_FAVORITE)
        .setEmoji("⭐")
        .setLabel("Favorite")
        .setStyle(ButtonStyle.Secondary), new ButtonBuilder()
        .setCustomId(CUSTOM_ID.MUSIC_VOTESKIP)
        .setEmoji("🗳️")
        .setLabel("Vote Skip")
        .setStyle(ButtonStyle.Secondary));
}
/**
 * Build queue navigation buttons.
 */
export function buildQueueNavigation(currentPage, totalPages) {
    return new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId("queue:first")
        .setEmoji("⏮️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1), new ButtonBuilder()
        .setCustomId(`queue:prev:${currentPage}`)
        .setEmoji("◀️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1), new ButtonBuilder()
        .setCustomId(`queue:page:${currentPage}:${totalPages}`)
        .setLabel(`${currentPage} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true), new ButtonBuilder()
        .setCustomId(`queue:next:${currentPage}`)
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages), new ButtonBuilder()
        .setCustomId("queue:last")
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages));
}
/**
 * Build audio filter selection menu.
 */
export function buildFilterMenu(activeFilters) {
    const filters = [
        { name: "Bass Boost", value: "bassboost", emoji: "🔊" },
        { name: "Nightcore", value: "nightcore", emoji: "🌙" },
        { name: "Vaporwave", value: "vaporwave", emoji: "☁️" },
        { name: "8D Audio", value: "8d", emoji: "🎧" },
        { name: "Karaoke", value: "karaoke", emoji: "🎤" },
        { name: "Vibrato", value: "vibrato", emoji: "〰️" },
        { name: "Tremolo", value: "tremolo", emoji: "🌊" },
        { name: "Distortion", value: "distortion", emoji: "⚡" },
    ];
    const menu = new StringSelectMenuBuilder()
        .setCustomId("music:filter")
        .setPlaceholder("Select audio filters...")
        .setMinValues(0)
        .setMaxValues(filters.length);
    for (const filter of filters) {
        const option = new StringSelectMenuOptionBuilder()
            .setLabel(filter.name)
            .setValue(filter.value)
            .setEmoji(filter.emoji);
        if (activeFilters.includes(filter.value)) {
            option.setDefault(true);
        }
        menu.addOptions(option);
    }
    return new ActionRowBuilder().addComponents(menu);
}
// ── Smart recommendations ─────────────────────────────────────────────────────────
/**
 * Generate track recommendations based on current queue.
 * Uses simple algorithm based on queue history.
 */
export function generateRecommendations(queue, limit = 5) {
    if (queue.length === 0)
        return [];
    // Simple recommendation: suggest tracks from the same artists in queue
    const artistCounts = new Map();
    for (const track of queue) {
        if (track.artist) {
            artistCounts.set(track.artist, (artistCounts.get(track.artist) ?? 0) + 1);
        }
    }
    // Sort artists by frequency
    const sortedArtists = [...artistCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0]);
    // Generate search queries based on popular artists
    const recommendations = [];
    for (const artist of sortedArtists) {
        recommendations.push(`${artist} songs`);
        recommendations.push(`best of ${artist}`);
    }
    return recommendations.slice(0, limit);
}
/**
 * Build recommendations embed.
 */
export function buildRecommendationsEmbed(queue) {
    const recommendations = generateRecommendations(queue);
    if (recommendations.length === 0) {
        return EmbedFactory.music("Magdagdag ng maraming kanta sa queue para makakuha ng recommendations!", "🔮 Smart Recommendations");
    }
    const description = recommendations
        .map((rec, i) => `**${i + 1}.** \`${rec}\``)
        .join("\n");
    return EmbedFactory.music(`${description}\n\n_I-click ang recommendation o gamitin ang \`/play\` para maghanap._`, "🔮 Smart Recommendations");
}
//# sourceMappingURL=musicDashboard.js.map