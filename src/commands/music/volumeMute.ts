import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "musicmute",
  description: "Mute the music player volume (sets to 0). Use musicunmute to restore.",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["musicmute", "volumemute", "mmusic"],
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
    const prev = player.volume ?? 80;
    player.set?.("premuteVolume", prev);
    await player.setVolume?.(0);
    await ctx.reply({ embeds: [errorEmbed("🔇 Music muted. Use `/unmute` to restore volume.")] });
  },
};
export default command;
