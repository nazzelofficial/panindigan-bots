import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "equalizercustom",
  description: "Set custom EQ: bass, mid, treble adjustments (-0.25 to 1.0)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["customEQ", "eqcustom"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addNumberOption((o) => o.setName("bass").setDescription("Bass gain (-0.25 to 1.0, default 0)").setRequired(false).setMinValue(-0.25).setMaxValue(1.0))
      .addNumberOption((o) => o.setName("mid").setDescription("Mid gain (-0.25 to 1.0, default 0)").setRequired(false).setMinValue(-0.25).setMaxValue(1.0))
      .addNumberOption((o) => o.setName("treble").setDescription("Treble gain (-0.25 to 1.0, default 0)").setRequired(false).setMinValue(-0.25).setMaxValue(1.0)),
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player?.playing && !player?.paused) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    const bass = ctx.isSlash ? (ctx.interaction!.options.getNumber("bass") ?? 0) : (parseFloat(ctx.args[0] ?? "0") || 0);
    const mid  = ctx.isSlash ? (ctx.interaction!.options.getNumber("mid")  ?? 0) : (parseFloat(ctx.args[1] ?? "0") || 0);
    const treble = ctx.isSlash ? (ctx.interaction!.options.getNumber("treble") ?? 0) : (parseFloat(ctx.args[2] ?? "0") || 0);
    const bands = [
      { band: 0, gain: bass }, { band: 1, gain: bass }, { band: 2, gain: bass },
      { band: 3, gain: bass * 0.5 }, { band: 4, gain: bass * 0.25 },
      { band: 5, gain: mid }, { band: 6, gain: mid }, { band: 7, gain: mid },
      { band: 8, gain: mid }, { band: 9, gain: mid },
      { band: 10, gain: treble * 0.25 }, { band: 11, gain: treble * 0.5 },
      { band: 12, gain: treble }, { band: 13, gain: treble }, { band: 14, gain: treble },
    ];
    await player.setFilters?.({ equalizer: bands });
    await ctx.reply({ embeds: [successEmbed(`🎛️ Custom EQ applied — Bass: **${bass}** | Mid: **${mid}** | Treble: **${treble}**`)] });
  },
};
export default command;
