import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "bassboost",
  description: "Toggle bass boost audio filter",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["bass", "filterbassboost"],
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
    const enabled = player.get?.("filter_bassboost") ?? false;
    if (!enabled) {
      await player.setFilters?.({
        equalizer: [
          { band: 0, gain: 0.3 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.2 },
          { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 },
        ],
      });
      player.set?.("filter_bassboost", true);
      await ctx.reply({ embeds: [successEmbed("🔊 Bass boost filter **enabled**.")] });
    } else {
      await player.setFilters?.({});
      player.set?.("filter_bassboost", false);
      await ctx.reply({ embeds: [successEmbed("🔊 Bass boost filter **disabled**.")] });
    }
  },
};
export default command;
