import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const command: CommandDefinition = {
  name: "skipall",
  description: "Skip all songs in the queue and stop playback",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["stopall"],
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
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }
    
    const result = await MusicService.skipAll(player);
    await ctx.reply({ embeds: [result.success ? successEmbed(`⏹️ Skipped all **${result.count}** track${result.count !== 1 ? "s" : ""} and stopped playback.`) : errorEmbed(result.message)] });
  },
};
export default command;
