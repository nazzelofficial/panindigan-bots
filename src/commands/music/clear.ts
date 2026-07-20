import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "clear",
  description: "Clear the music queue (keeps current song playing)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["clearqueue", "qclear"],
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
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music queue.")] }); return; }
    const queueSize = player.queue?.tracks?.length ?? 0;
    if (queueSize === 0) { await ctx.reply({ embeds: [errorEmbed("The queue is already empty.")] }); return; }
    if (typeof player.queue?.splice === "function") player.queue.splice(0, queueSize);
    else if (typeof player.queue?.tracks?.splice === "function") player.queue.tracks.splice(0, queueSize);
    await ctx.reply({ embeds: [successEmbed(`🗑️ Cleared **${queueSize}** track${queueSize !== 1 ? "s" : ""} from the queue.`)] });
  },
};
export default command;
