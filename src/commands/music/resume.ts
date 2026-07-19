import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "resume",
  description: "Resume paused music",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["unpause", "res"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }
    if (!player.paused) { await ctx.reply({ embeds: [errorEmbed("Music is not paused.")] }); return; }
    await player.resume?.();
    await ctx.reply({ embeds: [successEmbed("▶️ Music resumed.")] });
  },
};
export default command;
