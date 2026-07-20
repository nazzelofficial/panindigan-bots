import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

// Track active vote-skips per guild: Map<guildId, Set<userId>>
const voteSkipSessions = new Map<string, Set<string>>();

const command: CommandDefinition = {
  name: "voteskip",
  description: "Start or cast a vote to skip the current song (majority of listeners must agree)",
  category: "Music",
  access: "general",
  premium: true,
  guildOnly: true,
  cooldown: 5,
  aliases: ["vskip", "vs"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    const member = ctx.interaction?.member ?? ctx.message?.member;
    if (!guild || !member) return;

    const player = ctx.client.lavalink!.getPlayer(guild.id);
    if (!player || !player.queue.current) {
      await ctx.reply({ embeds: [errorEmbed("Nothing is playing right now.")] });
      return;
    }

    const voiceChannelId = (member as any).voice?.channelId;
    if (!voiceChannelId || voiceChannelId !== player.voiceChannelId) {
      await ctx.reply({ embeds: [errorEmbed("You need to be in the same voice channel as the bot.")] });
      return;
    }

    const voiceChannel = guild.channels.cache.get(player.voiceChannelId!);
    const listeners = voiceChannel
      ? [...(voiceChannel as any).members.values()].filter((m: any) => !m.user.bot).length
      : 1;

    if (!voteSkipSessions.has(guild.id)) {
      voteSkipSessions.set(guild.id, new Set());
    }
    const votes = voteSkipSessions.get(guild.id)!;
    votes.add(ctx.userId);

    const required = Math.ceil(listeners / 2);
    const current = votes.size;

    if (current >= required) {
      voteSkipSessions.delete(guild.id);
      const skipped = player.queue.current;
      await player.skip();

      const embed = successEmbed(
        `Vote passed (${current}/${listeners}) — skipped **${skipped?.info?.title ?? "the current track"}**.`,
      );
      await ctx.reply({ embeds: [embed] });
    } else {
      const embed = baseEmbed("info")
        .setTitle("🗳️ Vote Skip")
        .setDescription(
          `<@${ctx.userId}> voted to skip **${player.queue.current?.info?.title ?? "the current track"}**.\n\n**Votes:** ${current}/${required} needed (${listeners} listener${listeners !== 1 ? "s" : ""})`,
        )
        .setFooter({ text: "Vote expires when the song ends or a new song plays" });
      await ctx.reply({ embeds: [embed] });
    }
  },
};

export default command;
