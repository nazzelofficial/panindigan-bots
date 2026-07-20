import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const command: CommandDefinition = {
  name: "forward",
  description: "Seek forward in the current song",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["ff", "fastforward"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("seconds").setDescription("Seconds to seek forward (default: 10)").setRequired(false).setMinValue(1).setMaxValue(600),
    ),
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
    const seconds = ctx.isSlash
      ? (ctx.interaction!.options.getInteger("seconds") ?? 10)
      : (parseInt(ctx.args[0] ?? "10") || 10);
    const current = player.position ?? 0;
    const duration = player.queue?.current?.info?.duration ?? player.queue?.current?.duration ?? 0;
    const next = Math.min(current + seconds * 1000, duration > 0 ? duration - 1000 : Infinity);
    
    const result = await MusicService.seek(player, next);
    if (!result.success) {
      await ctx.reply({ embeds: [errorEmbed(result.message)] });
      return;
    }
    
    await ctx.reply({ embeds: [successEmbed(`⏩ Seeked forward **${seconds}s**.`)] });
  },
};
export default command;
