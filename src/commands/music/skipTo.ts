import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "skipto",
  description: "Skip to a specific position in the queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["jumpto"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("position").setDescription("Queue position to skip to (1 = next)").setRequired(true).setMinValue(1),
    ),
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
    const pos = ctx.isSlash ? ctx.interaction!.options.getInteger("position", true) : (parseInt(ctx.args[0] ?? "1") || 1);
    const tracks = player.queue?.tracks ?? [];
    if (pos < 1 || pos > tracks.length) {
      await ctx.reply({ embeds: [errorEmbed(`Invalid position. Queue has **${tracks.length}** upcoming track${tracks.length !== 1 ? "s" : ""}.`)] });
      return;
    }
    const target = tracks[pos - 1];
    tracks.splice(0, pos - 1);
    if (typeof player.skip === "function") await player.skip();
    const title = target?.info?.title ?? target?.title ?? `Track #${pos}`;
    await ctx.reply({ embeds: [successEmbed(`⏭️ Skipped to **${title}** (position #${pos}).`)] });
  },
};
export default command;
