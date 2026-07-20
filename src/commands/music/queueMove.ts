import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const command: CommandDefinition = {
  name: "queuemove",
  description: "Move a track from one position to another in the queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["qmove", "movesong"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("from").setDescription("Current position (1-based)").setRequired(true).setMinValue(1))
      .addIntegerOption((o) => o.setName("to").setDescription("Target position (1-based)").setRequired(true).setMinValue(1)),
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
    const from = ctx.isSlash ? ctx.interaction!.options.getInteger("from", true) : (parseInt(ctx.args[0] ?? "0") || 0);
    const to   = ctx.isSlash ? ctx.interaction!.options.getInteger("to",   true) : (parseInt(ctx.args[1] ?? "0") || 0);
    
    const result = await MusicService.moveTrackInQueue(player, from - 1, to - 1);
    if (!result.success) {
      await ctx.reply({ embeds: [errorEmbed(result.message)] });
      return;
    }
    
    await ctx.reply({ embeds: [errorEmbed(result.message)] });
  },
};
export default command;
