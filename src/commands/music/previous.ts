import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const command: CommandDefinition = {
  name: "previous",
  description: "Play the previous song",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["prev", "back"],
  slashData: (b) => b as SlashCommandBuilder,
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
    
    const result = await MusicService.playPrevious(player);
    if (!result.success) {
      await ctx.reply({ embeds: [errorEmbed(result.message)] });
      return;
    }
    
    await ctx.reply({ embeds: [errorEmbed(`⏮️ Playing previous track: **${result.track?.info?.title ?? result.track?.title ?? "previous track"}**`)] });
  },
};
export default command;
