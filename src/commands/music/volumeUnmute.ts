import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "musicunmute",
  description: "Unmute the music player (restores previous volume). Pair with musicmute.",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["musicunmute", "volumeunmute", "munmute"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }
    const restore = player.get?.("premuteVolume") ?? 80;
    await player.setVolume?.(restore);
    player.set?.("premuteVolume", null);
    await ctx.reply({ embeds: [successEmbed(`🔊 Music unmuted. Volume restored to **${restore}%**.`)] });
  },
};
export default command;
