import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "queueshuffle",
  description: "Shuffle the music queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["qs"],
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
    const size = player.queue?.tracks?.length ?? 0;
    if (size < 2) { await ctx.reply({ embeds: [errorEmbed("Need at least 2 tracks in the queue to shuffle.")] }); return; }
    if (typeof player.queue?.shuffle === "function") player.queue.shuffle();
    else {
      const tracks = player.queue?.tracks ?? [];
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
    }
    await ctx.reply({ embeds: [successEmbed(`🔀 Queue shuffled! **${size}** tracks reordered.`)] });
  },
};
export default command;
