import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "volumedown",
  description: "Decrease volume by 10",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["vdown", "voldown"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }
    const current = player.volume ?? 80;
    const next = Math.max(0, current - 10);
    await player.setVolume?.(next);
    await ctx.reply({ embeds: [successEmbed(`🔉 Volume decreased: **${current}%** → **${next}%**`)] });
  },
};
export default command;
