import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

function fmtTime(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const command: CommandDefinition = {
  name: "jump",
  description: "Jump to a specific time in the current song",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["seek", "goto"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("minutes").setDescription("Minutes").setRequired(false).setMinValue(0))
      .addIntegerOption((o) => o.setName("seconds").setDescription("Seconds").setRequired(false).setMinValue(0).setMaxValue(59)),
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player?.playing && !player?.paused) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    let totalSeconds: number;
    if (ctx.isSlash) {
      const mins = ctx.interaction!.options.getInteger("minutes") ?? 0;
      const secs = ctx.interaction!.options.getInteger("seconds") ?? 0;
      totalSeconds = mins * 60 + secs;
    } else {
      // Parse "1:30" or "90"
      const raw = ctx.args[0] ?? "0";
      if (raw.includes(":")) {
        const [m, s] = raw.split(":").map(Number);
        totalSeconds = (m || 0) * 60 + (s || 0);
      } else {
        totalSeconds = parseInt(raw) || 0;
      }
    }
    
    const result = await MusicService.seek(player, totalSeconds * 1000);
    if (!result.success) {
      await ctx.reply({ embeds: [errorEmbed(result.message)] });
      return;
    }
    
    await ctx.reply({ embeds: [successEmbed(`⏩ Jumped to **${fmtTime(totalSeconds)}**.`)] });
  },
};
export default command;
