import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "nowplaying",
  description: "Show the currently playing track",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["np", "current"],
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const player = (ctx.client.lavalink as any).players?.get(guild.id);
    if (!player?.queue?.current) {
      await ctx.reply({ embeds: [infoEmbed("Nothing is currently playing.")] });
      return;
    }

    const track = player.queue.current;
    const position = player.position ?? 0;
    const duration = track.duration ?? 0;

    function formatMs(ms: number): string {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
    }

    const pct = duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0;
    const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));

    const embed = baseEmbed("primary")
      .setTitle("🎵 Now Playing")
      .setDescription(`**[${track.title}](${track.uri ?? ""})**\nby ${track.author ?? "Unknown Artist"}`)
      .addFields(
        { name: "Progress", value: `${formatMs(position)} [${bar}] ${formatMs(duration)}`, inline: false },
        { name: "Requester", value: track.requester ? `<@${track.requester}>` : "Unknown", inline: true },
        { name: "Status", value: player.paused ? "⏸️ Paused" : "▶️ Playing", inline: true },
        { name: "Volume", value: `🔊 ${player.volume ?? 100}%`, inline: true },
        { name: "Source", value: track.sourceName ?? "Unknown", inline: true },
        { name: "Queue", value: `${player.queue?.tracks?.length ?? 0} track(s) next`, inline: true },
      );

    if (track.thumbnail) embed.setThumbnail(track.thumbnail);
    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
