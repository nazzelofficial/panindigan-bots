import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

function parseTime(input: string): number | null {
  // Accepts: 1:23, 1:23:45, 90s, 90
  const colonMatch = input.match(/^(?:(\d+):)?(\d+):(\d+)$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1] ?? "0");
    const m = parseInt(colonMatch[2]);
    const s = parseInt(colonMatch[3]);
    return (h * 3600 + m * 60 + s) * 1000;
  }
  const secondsMatch = input.match(/^(\d+)s?$/);
  if (secondsMatch) return parseInt(secondsMatch[1]) * 1000;
  return null;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

const command: CommandDefinition = {
  name: "seek",
  description: "Switch to isang bahagi ng current track (e.g. 1:30 o 90)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("position").setDescription("Oras (e.g. 1:30 o 90 para sa 90 seconds)").setRequired(true),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    if (!lava) { await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] }); return; }

    const player = lava.getPlayer?.(guild.id);
    if (!player?.playing) { await ctx.reply({ embeds: [errorEmbed("No track is currently playing.")] }); return; }

    const input = ctx.isSlash ? ctx.interaction!.options.getString("position", true) : ctx.args[0];
    if (!input) { await ctx.reply({ embeds: [errorEmbed("Provide a oras (e.g. `1:30` o `90`).")] }); return; }

    const posMs = parseTime(input);
    if (posMs === null) { await ctx.reply({ embeds: [errorEmbed("Invalid na oras. Use format: `1:30` o `90`.")] }); return; }

    const result = await MusicService.seek(player, posMs);
    if (!result.success) {
      await ctx.reply({ embeds: [errorEmbed(result.message)] });
      return;
    }

    await ctx.reply({ embeds: [successEmbed(`⏩ Switch to **${formatMs(posMs)}**`)] });
  },
};

export default command;
