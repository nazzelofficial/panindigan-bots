import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "8d",
  description: "Toggle 8D audio filter (rotational surround sound effect)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["filter8d"],
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
    const enabled = player.get?.("filter_8d") ?? false;
    if (!enabled) {
      await player.setFilters?.({ rotation: { rotationHz: 0.2 } });
      player.set?.("filter_8d", true);
      await ctx.reply({ embeds: [errorEmbed("🎧 8D audio filter **enabled**.")] });
    } else {
      await player.setFilters?.({});
      player.set?.("filter_8d", false);
      await ctx.reply({ embeds: [errorEmbed("🎧 8D audio filter **disabled**.")] });
    }
  },
};
export default command;
