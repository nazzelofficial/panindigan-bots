import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "vaporwave",
  description: "Toggle vaporwave filter (slower, lower pitch)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["vapor", "filtervaporwave"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player?.playing && !player?.paused) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    const enabled = player.get?.("filter_vaporwave") ?? false;
    if (!enabled) {
      await player.setFilters?.({ timescale: { speed: 0.8, pitch: 0.85, rate: 1.0 } });
      player.set?.("filter_vaporwave", true);
      await ctx.reply({ embeds: [successEmbed("🌊 Vaporwave filter **enabled**.")] });
    } else {
      await player.setFilters?.({});
      player.set?.("filter_vaporwave", false);
      await ctx.reply({ embeds: [successEmbed("🌊 Vaporwave filter **disabled**.")] });
    }
  },
};
export default command;
