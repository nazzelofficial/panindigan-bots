import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

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
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
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
