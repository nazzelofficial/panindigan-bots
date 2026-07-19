import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "volumeup",
  description: "Increase volume by 10",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["vup", "volup"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }
    const current = player.volume ?? 80;
    const next = Math.min(200, current + 10);
    await player.setVolume?.(next);
    await ctx.reply({ embeds: [successEmbed(`🔊 Volume increased: **${current}%** → **${next}%**`)] });
  },
};
export default command;
