import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "remove",
  description: "Remove a song from the queue by position",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["dequeue", "rm"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) =>
      o.setName("position").setDescription("Queue position to remove (1 = next)").setRequired(true).setMinValue(1),
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
    const removed = tracks.splice(pos - 1, 1)[0];
    const title = removed?.info?.title ?? removed?.title ?? `Track #${pos}`;
    await ctx.reply({ embeds: [errorEmbed(`🗑️ Removed **${title}** from position #${pos}.`)] });
  },
};
export default command;
