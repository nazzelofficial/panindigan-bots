import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import {
  createSearchingEmbed,
  createPlaylistLoadingEmbed,
  createPlaylistLoadedEmbed,
  formatDuration as formatDurationEmbed,
} from "../../features/music/embeds/musicEmbeds.js";
import { MusicControllerManager } from "../../features/music/controller/musicController.js";

function getMusicUnavailableEmbed() {
  return errorEmbed("❌ Music service is currently unavailable.\nThe Lavalink server is offline or unreachable.\nPlease try again later.");
}

const command: CommandDefinition = {
  name: "play",
  description: "Play a song or playlist from a URL or search query",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["p"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("query").setDescription("Song name or URL").setRequired(true).setAutocomplete(true),
      ),

  async autocomplete(interaction, client) {
    const query = String(interaction.options.getFocused() ?? "").trim();
    if (!query || query.length < 2) {
      await interaction.respond([{ name: "Type a song name or URL to search…", value: "lofi chill beats" }]);
      return;
    }
    const lava = client.lavalink as any;
    if (!lava) { await interaction.respond([]); return; }
    try {
      // lavalink-client exposes search on the manager directly
      const result = await (lava.search
        ? lava.search({ query, source: "ytsearch" }, client.user!)
        : lava.getPlayer(interaction.guildId)?.search?.({ query, source: "ytsearch" }, client.user!)
      ).catch(() => null);
      const tracks: any[] = result?.tracks ?? [];
      await interaction.respond(
        tracks.slice(0, 10).map((t: any) => ({
          name: `${t.info.title} — ${t.info.author}`.slice(0, 100),
          value: (t.info.uri ?? t.info.title).slice(0, 100),
        })),
      );
    } catch {
      await interaction.respond([]);
    }
  },

  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }

    const guild  = ctx.interaction?.guild ?? ctx.message?.guild;
    const member = ctx.interaction?.member ?? ctx.message?.member;
    if (!guild || !member) return;

    const voiceChannelId = (member as any).voice?.channelId;
    if (!voiceChannelId) {
      await ctx.reply({ embeds: [errorEmbed("You need to be in a voice channel to use music commands.")] });
      return;
    }

    const query = ctx.isSlash ? ctx.interaction!.options.getString("query", true) : ctx.args.join(" ");
    if (!query) { await ctx.reply({ embeds: [errorEmbed("Provide a song name or URL.")] }); return; }

    const textChannelId = ctx.interaction?.channelId ?? ctx.message?.channelId;
    const textChannel = ctx.client.channels.cache.get(textChannelId!) as any;

    // Send searching embed
    await ctx.reply({ embeds: [createSearchingEmbed(query)] });

    let player = ctx.client.lavalink!.getPlayer(guild.id);
    if (!player) {
      player = ctx.client.lavalink!.createPlayer({
        guildId: guild.id,
        voiceChannelId,
        textChannelId,
        selfDeaf: true,
        selfMute: false,
        volume: 80,
      });
    }

    if (!player.connected) await player.connect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = null;
    try {
      result = await player.search({ query, source: "ytsearch" }, ctx.client.user!);
    } catch {
      if (ctx.isSlash) {
        await ctx.interaction!.editReply({ embeds: [errorEmbed("❌ Music service unavailable — could not search for that track. Try again shortly.")] });
      } else {
        await ctx.message!.edit({ embeds: [errorEmbed("❌ Music service unavailable — could not search for that track. Try again shortly.")] });
      }
      return;
    }

    if (!result || result.loadType === "empty" || result.loadType === "error") {
      if (ctx.isSlash) {
        await ctx.interaction!.editReply({ embeds: [errorEmbed("No results found for your query.")] });
      } else {
        await ctx.message!.edit({ embeds: [errorEmbed("No results found for your query.")] });
      }
      return;
    }

    if (result.loadType === "playlist") {
      // Send loading embed
      if (ctx.isSlash) {
        await ctx.interaction!.editReply({ embeds: [createPlaylistLoadingEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", 0, result.tracks.length)] });
      } else {
        await ctx.message!.edit({ embeds: [createPlaylistLoadingEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", 0, result.tracks.length)] });
      }
      
      for (const track of result.tracks) {
        track.requester = ctx.userId;
        player.queue.add(track);
      }
      
      const totalDuration = result.tracks.reduce((acc: number, t: any) => acc + (t.info.duration || 0), 0);
      if (ctx.isSlash) {
        await ctx.interaction!.editReply({
          embeds: [createPlaylistLoadedEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", result.tracks.length, totalDuration)],
        });
      } else {
        await ctx.message!.edit({
          embeds: [createPlaylistLoadedEmbed(result.playlist?.name ?? "Playlist", result.playlist?.artworkUrl ?? "", result.tracks.length, totalDuration)],
        });
      }

      if (!player.playing) await player.play().catch(() => {});
    } else {
      const track = result.tracks[0];
      track.requester = ctx.userId;
      player.queue.add(track);
      
      if (!player.playing) {
        await player.play().catch(() => {});
        // Controller will be updated by trackStart event
        if (ctx.isSlash) {
          await ctx.interaction!.editReply({ embeds: [errorEmbed(`▶️ Now Playing\n**${track.info.title}**\nRequested by <@${ctx.userId}>`).setThumbnail(track.info.artworkUrl ?? null)] });
        } else {
          await ctx.message!.edit({ embeds: [errorEmbed(`▶️ Now Playing\n**${track.info.title}**\nRequested by <@${ctx.userId}>`).setThumbnail(track.info.artworkUrl ?? null)] });
        }
      } else {
        const pos = player.queue.tracks.length;
        if (ctx.isSlash) {
          await ctx.interaction!.editReply({
            embeds: [
              errorEmbed(`➕ Added to queue at position #${pos}\n**${track.info.title}**\nRequested by <@${ctx.userId}>`)
                .setThumbnail(track.info.artworkUrl ?? null),
            ],
          });
        } else {
          await ctx.message!.edit({
            embeds: [
              errorEmbed(`➕ Added to queue at position #${pos}\n**${track.info.title}**\nRequested by <@${ctx.userId}>`)
                .setThumbnail(track.info.artworkUrl ?? null),
            ],
          });
        }
      }
    }
  },
};

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
    : `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default command;
