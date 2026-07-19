import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "rewind",
  description: "Seek backward in the current song",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["rw", "rew"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("seconds").setDescription("Seconds to rewind (default: 10)").setRequired(false).setMinValue(1).setMaxValue(600),
    ),
  async execute(ctx) {
    if (!ctx.client.lavalink) { await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] }); return; }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player?.playing && !player?.paused) { await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] }); return; }
    const seconds = ctx.isSlash
      ? (ctx.interaction!.options.getInteger("seconds") ?? 10)
      : (parseInt(ctx.args[0] ?? "10") || 10);
    const current = player.position ?? 0;
    const next = Math.max(0, current - seconds * 1000);
    await player.seek?.(next);
    await ctx.reply({ embeds: [successEmbed(`⏪ Rewound **${seconds}s**.`)] });
  },
};
export default command;
