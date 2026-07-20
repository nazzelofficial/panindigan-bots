import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "replay",
  description: "Replay the current song from the beginning",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["restart", "replaycurrent"],
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
    await player.seek?.(0);
    const title = player.queue?.current?.info?.title ?? player.queue?.current?.title ?? "current track";
    await ctx.reply({ embeds: [successEmbed(`🔁 Replaying **${title}** from the beginning.`)] });
  },
};
export default command;
