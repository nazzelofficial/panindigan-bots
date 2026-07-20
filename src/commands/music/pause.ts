import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicControllerManager } from "../../features/music/controller/musicController.js";

const command: CommandDefinition = {
  name: "pause",
  description: "Pause the current song",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["pa"],
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
    if (!player?.playing) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    if (player.paused) { await ctx.reply({ embeds: [errorEmbed("Music is already paused.")] }); return; }
    await player.pause?.();
    
    // Update controller state
    MusicControllerManager.updateState(guild.id, ctx.interaction?.channelId ?? ctx.message?.channelId ?? "", { isPaused: true });
    
    await ctx.reply({ embeds: [errorEmbed("⏸️ Music paused. Use `/resume` to continue.")] });
  },
};
export default command;
