import type { Guild, VoiceBasedChannel, TextChannel } from "discord.js";
import { errorEmbed } from "../utils/embeds.js";
import {
  createSearchingEmbed,
  createPlaylistLoadingEmbed,
  createPlaylistLoadedEmbed,
} from "../features/music/embeds/musicEmbeds.js";

export interface MusicPlayOptions {
  guild: Guild;
  voiceChannelId: string;
  textChannelId: string;
  query: string;
  userId: string;
  client: any;
  isSlash: boolean;
  interaction?: any;
  message?: any;
}

export interface MusicPlayResult {
  success: boolean;
  message: string;
  embed?: any;
  trackCount?: number;
  totalDuration?: number;
}

export class MusicService {
  /**
   * Validate music operation prerequisites
   */
  static validateMusicOperation(client: any): string | null {
    const lava = client.lavalink;
    if (!lava) {
      return "Music service is currently unavailable. The Lavalink server is offline or unreachable.";
    }
    return null;
  }

  /**
   * Create or get player for a guild
   */
  static async getOrCreatePlayer(client: any, guildId: string, voiceChannelId: string, textChannelId: string): Promise<any> {
    let player = client.lavalink!.getPlayer(guildId);
    if (!player) {
      player = client.lavalink!.createPlayer({
        guildId,
        voiceChannelId,
        textChannelId,
        selfDeaf: true,
        selfMute: false,
        volume: 80,
      });
    }

    if (!player.connected) {
      await player.connect();
    }

    return player;
  }

  /**
   * Search for tracks
   */
  static async searchTracks(player: any, query: string, botUserId: string): Promise<any> {
    try {
      return await player.search({ query, source: "ytsearch" }, { id: botUserId, username: "bot" });
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle playlist loading
   */
  static async loadPlaylist(
    player: any,
    result: any,
    userId: string,
    isSlash: boolean,
    interaction?: any,
    message?: any,
    botMessage?: any
  ): Promise<MusicPlayResult> {
    const playlistName = result.playlist?.name ?? "Playlist";
    const artworkUrl = result.playlist?.artworkUrl ?? "";
    const trackCount = result.tracks.length;

    // Send loading embed
    const loadingEmbed = createPlaylistLoadingEmbed(playlistName, artworkUrl, 0, trackCount);
    await this.sendResponse(isSlash, loadingEmbed, interaction, message, botMessage);

    // Add tracks to queue
    for (const track of result.tracks) {
      track.requester = userId;
      player.queue.add(track);
    }

    const totalDuration = result.tracks.reduce((acc: number, t: any) => acc + (t.info.duration || 0), 0);
    const loadedEmbed = createPlaylistLoadedEmbed(playlistName, artworkUrl, trackCount, totalDuration);
    await this.sendResponse(isSlash, loadedEmbed, interaction, message, botMessage);

    if (!player.playing) {
      await player.play().catch(() => {});
    }

    return {
      success: true,
      message: `Loaded ${trackCount} tracks from playlist`,
      trackCount,
      totalDuration,
    };
  }

  /**
   * Handle single track loading
   */
  static async loadTrack(
    player: any,
    track: any,
    userId: string,
    isSlash: boolean,
    interaction?: any,
    message?: any,
    botMessage?: any
  ): Promise<MusicPlayResult> {
    track.requester = userId;
    player.queue.add(track);

    if (!player.playing) {
      await player.play().catch(() => {});
      const nowPlayingEmbed = errorEmbed(`▶️ Now Playing\n**${track.info.title}**\nRequested by <@${userId}>`).setThumbnail(track.info.artworkUrl ?? null);
      await this.sendResponse(isSlash, nowPlayingEmbed, interaction, message, botMessage);
    } else {
      const pos = player.queue.tracks.length;
      const queueEmbed = errorEmbed(`➕ Added to queue at position #${pos}\n**${track.info.title}**\nRequested by <@${userId}>`).setThumbnail(track.info.artworkUrl ?? null);
      await this.sendResponse(isSlash, queueEmbed, interaction, message, botMessage);
    }

    return {
      success: true,
      message: `Added ${track.info.title} to queue`,
    };
  }

  /**
   * Send response based on command type (slash vs prefix)
   */
  static async sendResponse(
    isSlash: boolean,
    embed: any,
    interaction?: any,
    message?: any,
    botMessage?: any
  ): Promise<void> {
    if (isSlash && interaction) {
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    } else if (botMessage && botMessage.author?.id === message?.client?.user?.id) {
      await botMessage.edit({ embeds: [embed] });
    } else if (message) {
      await message.reply({ embeds: [embed] });
    }
  }

  /**
   * Play music (main entry point)
   */
  static async play(options: MusicPlayOptions): Promise<MusicPlayResult> {
    const { guild, voiceChannelId, textChannelId, query, userId, client, isSlash, interaction, message } = options;

    // Validate music service
    const validationError = this.validateMusicOperation(client);
    if (validationError) {
      return { success: false, message: validationError };
    }

    // Get or create player
    const player = await this.getOrCreatePlayer(client, guild.id, voiceChannelId, textChannelId);

    // Search for tracks
    const result = await this.searchTracks(player, query, client.user?.id || "bot");
    if (!result || result.loadType === "empty" || result.loadType === "error") {
      return { success: false, message: "No results found for your query." };
    }

    // Store bot message for prefix commands
    let botMessage: any = null;
    if (!isSlash && message) {
      botMessage = await message.reply({ embeds: [createSearchingEmbed(query)] });
    }

    // Handle based on result type
    if (result.loadType === "playlist") {
      return await this.loadPlaylist(player, result, userId, isSlash, interaction, message, botMessage);
    } else {
      const track = result.tracks[0];
      return await this.loadTrack(player, track, userId, isSlash, interaction, message, botMessage);
    }
  }

  /**
   * Skip current track
   */
  static async skip(player: any): Promise<{ success: boolean; message: string }> {
    if (!player || !player.playing) {
      return { success: false, message: "Nothing is playing right now." };
    }

    player.queue.skip();
    return { success: true, message: "Skipped to next track." };
  }

  /**
   * Pause playback
   */
  static async pause(player: any): Promise<{ success: boolean; message: string }> {
    if (!player || !player.playing) {
      return { success: false, message: "Nothing is playing right now." };
    }

    player.pause(true);
    return { success: true, message: "Paused playback." };
  }

  /**
   * Resume playback
   */
  static async resume(player: any): Promise<{ success: boolean; message: string }> {
    if (!player || !player.paused) {
      return { success: false, message: "Playback is not paused." };
    }

    player.pause(false);
    return { success: true, message: "Resumed playback." };
  }

  /**
   * Stop playback and clear queue
   */
  static async stop(player: any): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    player.queue.clear();
    player.stop();
    return { success: true, message: "Stopped playback and cleared queue." };
  }

  /**
   * Set volume
   */
  static async setVolume(player: any, volume: number): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    if (volume < 0 || volume > 200) {
      return { success: false, message: "Volume must be between 0 and 200." };
    }

    player.setVolume(volume);
    return { success: true, message: `Volume set to ${volume}%.` };
  }

  /**
   * Clear queue
   */
  static async clearQueue(player: any): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const count = player.queue.tracks.length;
    player.queue.clear();
    return { success: true, message: `Cleared ${count} tracks from queue.` };
  }

  /**
   * Shuffle queue
   */
  static async shuffleQueue(player: any): Promise<{ success: boolean; message: string }> {
    if (!player || player.queue.tracks.length < 2) {
      return { success: false, message: "Need at least 2 tracks in queue to shuffle." };
    }

    player.queue.shuffle();
    return { success: true, message: "Queue shuffled." };
  }

  /**
   * Disconnect from voice channel
   */
  static async disconnect(player: any): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    player.queue.clear();
    player.stop();
    player.disconnect();
    return { success: true, message: "Disconnected from voice channel." };
  }

  /**
   * Get queue information
   */
  static getQueue(player: any): { current: any; tracks: any[]; totalDuration: number } {
    const current = player.queue?.current;
    const tracks = player.queue?.tracks ?? [];
    const totalDuration = tracks.reduce((acc: number, t: any) => acc + (t.info?.duration || 0), 0);
    return { current, tracks, totalDuration };
  }

  /**
   * Add track to queue
   */
  static async addToQueue(player: any, track: any): Promise<{ success: boolean; message: string; position?: number }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    player.queue.add(track);
    const position = player.queue.tracks.length;
    return { success: true, message: `Added to queue`, position };
  }

  /**
   * Remove track from queue
   */
  static async removeFromQueue(player: any, index: number): Promise<{ success: boolean; message: string; track?: any }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const tracks = player.queue?.tracks ?? [];
    if (index < 0 || index >= tracks.length) {
      return { success: false, message: "Invalid track index." };
    }

    const track = tracks[index];
    player.queue.remove(index);
    return { success: true, message: `Removed track from queue`, track };
  }

  /**
   * Move track in queue
   */
  static async moveTrackInQueue(player: any, fromIndex: number, toIndex: number): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const tracks = player.queue?.tracks ?? [];
    if (fromIndex < 0 || fromIndex >= tracks.length || toIndex < 0 || toIndex >= tracks.length) {
      return { success: false, message: "Invalid track indices." };
    }

    const track = tracks.splice(fromIndex, 1)[0];
    tracks.splice(toIndex, 0, track);
    return { success: true, message: `Moved track from position ${fromIndex + 1} to ${toIndex + 1}` };
  }

  /**
   * Set loop mode
   */
  static async setLoopMode(player: any, mode: "off" | "track" | "queue"): Promise<{ success: boolean; message: string; mode: string }> {
    if (!player) {
      return { success: false, message: "No active player.", mode: "off" };
    }

    if (typeof player.setRepeatMode === "function") {
      await player.setRepeatMode(mode === "off" ? 0 : mode === "track" ? 1 : 2);
    } else if (player.repeatMode !== undefined) {
      player.repeatMode = mode;
    }

    return { success: true, message: `Loop mode set to ${mode}`, mode };
  }

  /**
   * Seek to position in track
   */
  static async seek(player: any, positionMs: number): Promise<{ success: boolean; message: string }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    if (!player.playing && !player.paused) {
      return { success: false, message: "Nothing is currently playing." };
    }

    const duration = player.queue?.current?.info?.duration ?? player.current?.duration ?? 0;
    if (duration > 0 && positionMs > duration) {
      return { success: false, message: `Track is only ${duration}ms long.` };
    }

    if (typeof player.seek === "function") {
      await player.seek(positionMs);
    }

    return { success: true, message: `Seeked to ${positionMs}ms` };
  }

  /**
   * Get now playing information
   */
  static getNowPlaying(player: any): { success: boolean; track?: any; position?: number; message?: string } {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const track = player.queue?.current;
    if (!track) {
      return { success: false, message: "Nothing is currently playing." };
    }

    const position = player.position ?? 0;
    return { success: true, track, position };
  }

  /**
   * Play previous track
   */
  static async playPrevious(player: any): Promise<{ success: boolean; message: string; track?: any }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    if (!player.playing && !player.paused) {
      return { success: false, message: "Nothing is currently playing." };
    }

    const prev = player.queue?.previous ?? player.get?.("previousTrack");
    if (!prev) {
      return { success: false, message: "No previous track available." };
    }

    if (typeof player.skip === "function") {
      player.queue?.unshift?.(player.queue.current);
      player.queue?.unshift?.(prev);
      await player.skip();
    } else {
      await player.seek?.(0);
    }

    const title = prev.info?.title ?? prev.title ?? "previous track";
    return { success: true, message: `Playing previous track: ${title}`, track: prev };
  }

  /**
   * Skip all tracks and stop playback
   */
  static async skipAll(player: any): Promise<{ success: boolean; message: string; count?: number }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const count = (player.queue?.tracks?.length ?? 0) + 1;
    const tracks = player.queue?.tracks ?? [];
    tracks.splice(0, tracks.length);

    if (typeof player.stop === "function") {
      await player.stop();
    } else if (typeof player.skip === "function") {
      await player.skip();
    }

    return { success: true, message: `Skipped all ${count} tracks and stopped playback.`, count };
  }

  /**
   * Skip to specific position in queue
   */
  static async skipTo(player: any, position: number): Promise<{ success: boolean; message: string; track?: any }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    const tracks = player.queue?.tracks ?? [];
    if (position < 1 || position > tracks.length) {
      return { success: false, message: `Invalid position. Queue has ${tracks.length} tracks.` };
    }

    const target = tracks[position - 1];
    tracks.splice(0, position - 1);

    if (typeof player.skip === "function") {
      await player.skip();
    }

    const title = target?.info?.title ?? target?.title ?? `Track #${position}`;
    return { success: true, message: `Skipped to ${title} (position #${position})`, track: target };
  }

  /**
   * Replay current track from beginning
   */
  static async replay(player: any): Promise<{ success: boolean; message: string; track?: any }> {
    if (!player) {
      return { success: false, message: "No active player." };
    }

    if (!player.playing && !player.paused) {
      return { success: false, message: "Nothing is currently playing." };
    }

    await player.seek?.(0);

    const title = player.queue?.current?.info?.title ?? player.queue?.current?.title ?? "current track";
    return { success: true, message: `Replaying ${title} from the beginning.`, track: player.queue?.current };
  }
}
