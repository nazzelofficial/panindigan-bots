import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "autoplay",
  description: "Toggle autoplay mode (auto-adds related songs when queue ends)",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["ap"],
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
    const current = player.get?.("autoplay") ?? false;
    const next = !current;
    player.set?.("autoplay", next);
    await ctx.reply({ embeds: [errorEmbed(`🎵 Autoplay **${next ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
