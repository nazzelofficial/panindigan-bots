import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicControllerManager } from "../../features/music/controller/musicController.js";

const command: CommandDefinition = {
  name: "skip",
  description: "Skip the current or a specific number of tracks",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["s", "next"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("count").setDescription("Number of tracks to skip").setRequired(false).setMinValue(1)),
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

    const count = ctx.isSlash ? (ctx.interaction!.options.getInteger("count") ?? 1) : (parseInt(ctx.args[0] ?? "1") || 1);
    const current = player.queue.current;

    for (let i = 0; i < count; i++) {
      await player.skip?.();
    }

    // Update controller state (controller will be updated by trackStart event)
    await ctx.reply({ embeds: [errorEmbed(`⏭️ Skipped **${count}** track${count !== 1 ? "s" : ""}. Was playing: **${current.info.title}**`)] });
  },
};

export default command;
