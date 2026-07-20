import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const command: CommandDefinition = {
  name: "queueadd",
  description: "Add a song to the queue without immediately playing",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["qadd", "addqueue"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("query").setDescription("Song name or URL to add to queue").setRequired(true),
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
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active player. Use `/play` first to start music.")] }); return; }
    const query = ctx.isSlash ? ctx.interaction!.options.getString("query", true) : ctx.args.join(" ");
    if (!query) { await ctx.reply({ embeds: [errorEmbed("Please provide a song name or URL.")] }); return; }
    
    const result = await player.search?.({ query, source: "ytsearch" }, ctx.client.user!).catch(() => null);
    if (!result || result.loadType === "empty" || result.loadType === "error") {
      await ctx.reply({ embeds: [errorEmbed("No results found for your query.")] });
      return;
    }
    const track = result.tracks[0];
    const addResult = await MusicService.addToQueue(player, track);
    const title = track?.info?.title ?? track?.title ?? query;
    await ctx.reply({ embeds: [successEmbed(`➕ Added **${title}** to queue at position **#${addResult.position}**.`)] });
  },
};
export default command;
