import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicControllerManager } from "../../features/music/controller/musicController.js";

const command: CommandDefinition = {
  name: "stop",
  description: "Ihinto ang music at i-clear ang queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    if (!lava) { await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] }); return; }

    const player = lava.getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }

    // Clear queue and stop
    if (player.queue && typeof player.queue.clear === "function") player.queue.clear();
    if (typeof player.stop === "function") await player.stop();
    else if (typeof player.destroy === "function") await player.destroy();

    // Remove controller
    MusicControllerManager.removeController(guild.id);

    await ctx.reply({ embeds: [errorEmbed("⏹️ Naitigil ang music at na-clear ang queue.")] });
  },
};

export default command;
