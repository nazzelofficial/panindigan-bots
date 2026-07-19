import { PermissionFlagsBits, SlashCommandBuilder, ChannelType } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { sendLogEvent } from '@/features/logging/logEngine';
import { baseEmbed, errorEmbed, infoEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'nuke',
  description: 'Delete and recreate a channel, wiping all its messages',
  category: 'Moderation',
  access: 'moderator',
  guildOnly: true,
  cooldown: 30,
  memberPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption(o =>
        o.setName('channel').setDescription('Channel to nuke (defaults to current)').setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const target = ctx.isSlash ? ctx.interaction!.options.getChannel('channel') : ctx.args[0] ? await guild.channels.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null) : ctx.message?.channel;

    if (!target || !('delete' in target)) {
      await ctx.reply({ embeds: [errorEmbed('Invalid channel.')] });
      return;
    }

    const validTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum];
    if (!validTypes.includes(target.type as any)) {
      await ctx.reply({ embeds: [errorEmbed('Only text channels, announcement channels, and forums can be nuked.')] });
      return;
    }

    const ch = target as any;
    const position = ch.rawPosition ?? 0;
    const name: string = ch.name;
    const type = ch.type;
    const parentId: string | null = ch.parentId ?? null;
    const topic: string | null = ch.topic ?? null;
    const nsfw: boolean = ch.nsfw ?? false;
    const rateLimitPerUser: number = ch.rateLimitPerUser ?? 0;

    await ctx.reply({ embeds: [infoEmbed('💥 Nuking channel...')] });

    const moderatorTag = ctx.isSlash ? ctx.interaction!.user.tag : ctx.message!.author.tag;
    const moderatorId = ctx.userId;

    await ch.delete(`Nuked by ${moderatorTag}`);

    const newChannel = await guild.channels.create({
      name,
      type,
      parent: parentId ?? undefined,
      topic: topic ?? undefined,
      nsfw,
      rateLimitPerUser,
      reason: `Channel nuked by ${moderatorTag}`,
    }) as any;

    await newChannel.setPosition(position).catch(() => {});

    await sendLogEvent(guild.id, 'channelDelete', () =>
      baseEmbed('danger')
        .setTitle('💥 Channel Nuked')
        .addFields(
          { name: 'Channel', value: `#${name}`, inline: true },
          { name: 'Moderator', value: `<@${moderatorId}>`, inline: true },
          { name: 'New Channel', value: `<#${newChannel.id}>`, inline: true },
        ),
    );

    await newChannel.send({
      embeds: [
        baseEmbed('danger')
          .setTitle('💥 Channel Nuked')
          .setDescription(`This channel was wiped by <@${moderatorId}>.`),
      ],
    }).catch(() => {});
  },
};
export default command;
