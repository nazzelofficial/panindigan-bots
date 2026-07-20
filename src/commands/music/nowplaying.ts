import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { createNowPlayingEmbed, createMusicButtonRow } from "../../features/music/embeds/musicEmbeds.js";

const command: CommandDefinition = {
  name: "nowplaying",
  description: "Show the currently playing track",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["np", "current"],
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const player = (ctx.client.lavalink as any).players?.get(guild.id);
    if (!player?.queue?.current) {
      await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] });
      return;
    }

    const track = player.queue.current;
    const position = player.position ?? 0;

    const embed = createNowPlayingEmbed(player.queue, track, position);
    const buttons = createMusicButtonRow(player.paused, "off", false);

    await ctx.reply({ embeds: [embed], components: [buttons] });
  },
};

export default command;
