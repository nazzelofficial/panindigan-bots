import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { GuildModel } from "../../database/models/Guild.js";

const command: CommandDefinition = {
  name: "soundboardplay",
  description: "Play a sound from the server soundboard",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["playsound", "sb"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("name").setDescription("Name of the sound to play").setRequired(true),
    ),
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const member = ctx.interaction?.member ?? ctx.message?.member;
    const voiceChannelId = (member as any)?.voice?.channelId;
    if (!voiceChannelId) { await ctx.reply({ embeds: [errorEmbed("You need to be in a voice channel to use the soundboard.")] }); return; }
    const name = (ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0] ?? "").toLowerCase();
    const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
    const sounds: any[] = (doc as any)?.soundboard ?? [];
    const sound = sounds.find((s) => s.name === name);
    if (!sound) { await ctx.reply({ embeds: [errorEmbed(`Sound **"${name}"** not found. Use \`/soundboardlist\` to see available sounds.`)] }); return; }
    let player = (ctx.client.lavalink as any).getPlayer?.(guild.id);
    if (!player) {
      player = (ctx.client.lavalink as any).createPlayer?.({
        guildId: guild.id, voiceChannelId,
        textChannelId: ctx.interaction?.channelId ?? ctx.message?.channelId,
        selfDeaf: true, selfMute: false, volume: 80,
      });
    }
    if (!player?.connected) await player?.connect?.();
    const result = await player.search?.({ query: sound.url, source: "raw" }, ctx.client.user!).catch(() => null);
    if (!result?.tracks?.[0]) { await ctx.reply({ embeds: [errorEmbed("Failed to load the sound. The URL may be invalid.")] }); return; }
    player.queue?.add?.(result.tracks[0]);
    if (!player.playing) await player.play?.().catch(() => {});
    await ctx.reply({ embeds: [successEmbed(`🔊 Playing sound: **${sound.name}**`)] });
  },
};
export default command;
