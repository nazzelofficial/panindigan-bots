import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "filterclear",
  description: "Remove all active audio filters",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["clearfilter", "nofilter"],
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
    await player.setFilters?.({});
    // Clear any stored filter flags
    for (const flag of ["filter_8d", "filter_bassboost", "filter_nightcore", "filter_vaporwave"]) {
      player.set?.(flag, false);
    }
    await ctx.reply({ embeds: [successEmbed("🎛️ All audio filters cleared.")] });
  },
};
export default command;
