import { Message, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { Queue, Track, Player } from "lavalink-client";
import type { PanindiganClient } from "../../../structures/Client.js";
import {
  createNowPlayingEmbed,
  createTrackStartedEmbed,
  createTrackFinishedEmbed,
  createAutoPlayingNextEmbed,
  createQueueFinishedEmbed,
  createAutoplayStartedEmbed,
  createDisconnectedEmbed,
  createReconnectingEmbed,
  createNodeRestoredEmbed,
  createMusicButtonRow,
  formatDuration,
} from "../embeds/musicEmbeds.js";
import { scopedLogger } from "../../../utils/logger.js";

const musicLog = scopedLogger("musicController");
const musicEventLog = scopedLogger("musicEvents");

// ─── Controller State ───────────────────────────────────────────────────────
interface MusicControllerState {
  guildId: string;
  channelId: string;
  messageId: string | null;
  lastUpdate: number;
  isPaused: boolean;
  loopMode: string;
  isShuffle: boolean;
  progressTimer: NodeJS.Timeout | null;
}

// ─── Controller Registry ─────────────────────────────────────────────────────
const controllers = new Map<string, MusicControllerState>();

// ─── Controller Manager ─────────────────────────────────────────────────────
export class MusicControllerManager {
  private static readonly PROGRESS_UPDATE_INTERVAL = 15000; // 15 seconds
  private static readonly CONTROLLER_TIMEOUT = 300000; // 5 minutes
  private static client: PanindiganClient | null = null;

  /**
   * Initialize the controller manager with the Discord client
   */
  static initialize(client: PanindiganClient): void {
    this.client = client;
  }

  /**
   * Get or create a controller for a guild
   */
  static getController(guildId: string, channelId: string): MusicControllerState {
    const key = `${guildId}`;
    let controller = controllers.get(key);

    if (!controller) {
      controller = {
        guildId,
        channelId,
        messageId: null,
        lastUpdate: Date.now(),
        isPaused: false,
        loopMode: "off",
        isShuffle: false,
        progressTimer: null,
      };
      controllers.set(key, controller);
    }

    return controller;
  }

  /**
   * Remove a controller and clean up timers
   */
  static removeController(guildId: string): void {
    const key = `${guildId}`;
    const controller = controllers.get(key);

    if (controller) {
      // Clear progress timer to prevent memory leaks
      if (controller.progressTimer) {
        clearInterval(controller.progressTimer);
        controller.progressTimer = null;
      }
      controllers.delete(key);
      musicLog.info("Music controller removed and cleaned up", { guildId });
    }
  }

  /**
   * Get text channel from voice channel ID
   */
  private static async getTextChannel(voiceChannelId: string): Promise<TextChannel | null> {
    if (!this.client) return null;
    try {
      const guild = await this.client.guilds.fetch(voiceChannelId); // This is actually guild ID, need to fix
      // For now, we'll need to pass the text channel ID separately or get it from the queue
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update or create the Now Playing controller message
   */
  static async updateController(
    queue: Queue,
    track: Track,
    position: number,
    status: "playing" | "paused" | "buffering" | "stopped" | "live" = "playing",
    player?: Player,
    textChannel?: TextChannel
  ): Promise<void> {
    const guildId = player?.guildId || "unknown";
    const channelId = textChannel?.id || "";
    const controller = this.getController(guildId, channelId);
    const channel = textChannel;

    if (!channel) return;

    try {
      const embed = createNowPlayingEmbed(queue, track, position);
      const primaryRow = createMusicButtonRow(
        controller.isPaused,
        controller.loopMode,
        controller.isShuffle
      );

      // Update status in embed
      const statusEmoji = this.getStatusEmoji(status);
      embed.setTitle(`${statusEmoji} Now Playing`);

      if (controller.messageId) {
        // Edit existing message
        try {
          const message = await channel.messages.fetch(controller.messageId);
          await message.edit({
            embeds: [embed],
            components: [primaryRow],
          });
          controller.lastUpdate = Date.now();
          musicLog.info("Music controller updated", { 
            guildId,
            status,
            position: formatDuration(position),
          });
        } catch (error) {
          // Message might be deleted, create new one
          controller.messageId = null;
          await this.createNewController(channel, embed, primaryRow, controller);
        }
      } else {
        // Create new message
        await this.createNewController(channel, embed, primaryRow, controller);
      }

      // Start or restart progress timer
      if (player) {
        this.startProgressTimer(queue, controller, player, textChannel);
      }
    } catch (error) {
      musicLog.error("Failed to update music controller", { 
        guildId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create a new controller message
   */
  private static async createNewController(
    channel: TextChannel,
    embed: any,
    primaryRow: ActionRowBuilder<ButtonBuilder>,
    controller: MusicControllerState
  ): Promise<void> {
    const message = await channel.send({
      embeds: [embed],
      components: [primaryRow],
    });
    controller.messageId = message.id;
    controller.lastUpdate = Date.now();
    musicLog.info("Music controller created", { 
      guildId: controller.guildId, 
      messageId: message.id,
    });
  }

  /**
   * Start the progress update timer with cleanup guard
   */
  private static startProgressTimer(queue: Queue, controller: MusicControllerState, player: Player, textChannel?: TextChannel): void {
    // Clear existing timer to prevent duplicates
    if (controller.progressTimer) {
      clearInterval(controller.progressTimer);
      controller.progressTimer = null;
    }

    // Start new timer with reference for cleanup
    controller.progressTimer = setInterval(async () => {
      try {
        // Guard: Check if controller still exists and is valid
        const currentController = controllers.get(`${player.guildId}`);
        if (!currentController || currentController !== controller) {
          if (controller.progressTimer) {
            clearInterval(controller.progressTimer);
          }
          return;
        }

        if (!queue.current || !player.voiceChannelId) {
          this.removeController(player.guildId);
          return;
        }

        const position = player.position;
        await this.updateController(queue, queue.current, position, controller.isPaused ? "paused" : "playing", player, textChannel);
      } catch (error) {
        musicLog.error("Progress update failed", { 
          guildId: player.guildId, 
          error: error instanceof Error ? error.message : String(error),
        });
        // Clear timer on error to prevent repeated failures
        if (controller.progressTimer) {
          clearInterval(controller.progressTimer);
          controller.progressTimer = null;
        }
      }
    }, this.PROGRESS_UPDATE_INTERVAL).unref(); // unref() allows process to exit if this is the only timer
  }

  /**
   * Send a track started notification
   */
  static async sendTrackStarted(queue: Queue, track: Track, textChannel: TextChannel): Promise<void> {
    if (!textChannel) return;

    const embed = createTrackStartedEmbed(track);
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Track started", { 
      guildId: textChannel.guildId, 
      track: track.info.title,
      duration: track.info.duration,
      source: track.info.sourceName,
      requester: track.requester,
    });
  }

  /**
   * Send a track finished notification
   */
  static async sendTrackFinished(queue: Queue, track: Track, textChannel: TextChannel): Promise<void> {
    if (!textChannel) return;

    const embed = createTrackFinishedEmbed(track);
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Track finished", { 
      guildId: textChannel.guildId, 
      track: track.info.title,
      duration: track.info.duration,
    });
  }

  /**
   * Send an auto-playing next notification
   */
  static async sendAutoPlayingNext(queue: Queue, track: Track, textChannel: TextChannel): Promise<void> {
    if (!textChannel) return;

    const embed = createAutoPlayingNextEmbed(track);
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Auto-playing next", { 
      guildId: textChannel.guildId, 
      track: track.info.title,
      source: track.info.sourceName,
    });
  }

  /**
   * Send a queue finished notification and clear controller
   */
  static async sendQueueFinished(guildId: string, textChannel: TextChannel): Promise<void> {
    const controller = this.getController(guildId, textChannel.id);

    if (!textChannel) return;

    const embed = createQueueFinishedEmbed();

    if (controller.messageId) {
      try {
        const message = await textChannel.messages.fetch(controller.messageId);
        await message.edit({ embeds: [embed], components: [] });
      } catch (error) {
        await textChannel.send({ embeds: [embed] });
      }
    } else {
      await textChannel.send({ embeds: [embed] });
    }

    this.removeController(guildId);
    musicEventLog.info("Queue finished", { guildId });
  }

  /**
   * Send an autoplay started notification
   */
  static async sendAutoplayStarted(textChannel: TextChannel): Promise<void> {
    if (!textChannel) return;

    const embed = createAutoplayStartedEmbed();
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Autoplay started", { guildId: textChannel.guildId });
  }

  /**
   * Send a disconnected notification and clear controller
   */
  static async sendDisconnected(guildId: string, textChannel: TextChannel): Promise<void> {
    const controller = this.getController(guildId, textChannel.id);

    if (!textChannel) return;

    const embed = createDisconnectedEmbed();

    if (controller.messageId) {
      try {
        const message = await textChannel.messages.fetch(controller.messageId);
        await message.edit({ embeds: [embed], components: [] });
      } catch (error) {
        await textChannel.send({ embeds: [embed] });
      }
    } else {
      await textChannel.send({ embeds: [embed] });
    }

    this.removeController(guildId);
    musicEventLog.info("Disconnected", { guildId });
  }

  /**
   * Send a reconnecting notification
   */
  static async sendReconnecting(textChannel: TextChannel): Promise<void> {
    if (!textChannel) return;

    const embed = createReconnectingEmbed();
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Reconnecting", { guildId: textChannel.guildId });
  }

  /**
   * Send a node restored notification
   */
  static async sendNodeRestored(textChannel: TextChannel, nodeName: string): Promise<void> {
    if (!textChannel) return;

    const embed = createNodeRestoredEmbed(nodeName);
    await textChannel.send({ embeds: [embed] });
    musicEventLog.info("Node restored", { guildId: textChannel.guildId, nodeName });
  }

  /**
   * Update controller state
   */
  static updateState(
    guildId: string,
    channelId: string,
    updates: Partial<Pick<MusicControllerState, "isPaused" | "loopMode" | "isShuffle">>
  ): void {
    const controller = this.getController(guildId, channelId);
    Object.assign(controller, updates);
    musicLog.info("Music controller state updated", { guildId, updates });
  }

  /**
   * Get status emoji
   */
  private static getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      playing: "▶",
      paused: "⏸",
      buffering: "⏳",
      stopped: "⏹",
      live: "📻",
    };
    return emojis[status] || "▶";
  }

  /**
   * Cleanup all controllers (for bot shutdown)
   */
  static cleanupAll(): void {
    for (const [guildId, controller] of controllers.entries()) {
      if (controller.progressTimer) {
        clearInterval(controller.progressTimer);
      }
    }
    controllers.clear();
    musicLog.info("All music controllers cleaned up");
  }
}
