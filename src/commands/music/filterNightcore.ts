import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "nightcore",
  description: "Toggle nightcore filter (faster, higher pitch)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["nc", "filternightcore"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player?.playing && !player?.paused) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    const enabled = player.get?.("filter_nightcore") ?? false;
    if (!enabled) {
      await player.setFilters?.({ timescale: { speed: 1.25, pitch: 1.3, rate: 1.0 } });
      player.set?.("filter_nightcore", true);
      await ctx.reply({ embeds: [successEmbed("🌙 Nightcore filter **enabled**.")] });
    } else {
      await player.setFilters?.({});
      player.set?.("filter_nightcore", false);
      await ctx.reply({ embeds: [successEmbed("🌙 Nightcore filter **disabled**.")] });
    }
  },
};
export default command;
