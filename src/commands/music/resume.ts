import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicControllerManager } from "../../features/music/controller/musicController.js";

const command: CommandDefinition = {
  name: "resume",
  description: "Resume paused music",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["unpause", "res"],
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
    if (!player.paused) { await ctx.reply({ embeds: [errorEmbed("Music is not paused.")] }); return; }
    await player.resume?.();
    
    // Update controller state
    MusicControllerManager.updateState(guild.id, ctx.interaction?.channelId ?? ctx.message?.channelId ?? "", { isPaused: false });
    
    await ctx.reply({ embeds: [errorEmbed("▶️ Music resumed.")] });
  },
};
export default command;
