import { PermissionFlagsBits, ChannelType } from 'discord.js';
import { sendLogEvent } from '../../features/logging/logEngine.js';
import { baseEmbed, errorEmbed, infoEmbed } from '../../utils/embeds.js';
const command = {
    name: 'nuke',
    description: 'Delete and recreate a channel, wiping all its messages',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 30,
    memberPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    slashData: (b) => b
        .addChannelOption(o => o.setName('channel').setDescription('Channel to nuke (defaults to current)').setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const target = ctx.isSlash ? ctx.interaction.options.getChannel('channel') : ctx.args[0] ? await guild.channels.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null) : ctx.message?.channel;
        if (!target || !('delete' in target)) {
            await ctx.reply({ embeds: [errorEmbed('Invalid channel.')] });
            return;
        }
        const validTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum];
        if (!validTypes.includes(target.type)) {
            await ctx.reply({ embeds: [errorEmbed('Only text channels, announcement channels, and forums can be nuked.')] });
            return;
        }
        const ch = target;
        const position = ch.rawPosition ?? 0;
        const name = ch.name;
        const type = ch.type;
        const parentId = ch.parentId ?? null;
        const topic = ch.topic ?? null;
        const nsfw = ch.nsfw ?? false;
        const rateLimitPerUser = ch.rateLimitPerUser ?? 0;
        await ctx.reply({ embeds: [infoEmbed('💥 Nuking channel...')] });
        const moderatorTag = ctx.isSlash ? ctx.interaction.user.tag : ctx.message.author.tag;
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
        });
        await newChannel.setPosition(position).catch(() => { });
        await sendLogEvent(guild.id, 'channelDelete', () => baseEmbed('danger')
            .setTitle('💥 Channel Nuked')
            .addFields({ name: 'Channel', value: `#${name}`, inline: true }, { name: 'Moderator', value: `<@${moderatorId}>`, inline: true }, { name: 'New Channel', value: `<#${newChannel.id}>`, inline: true }));
        await newChannel.send({
            embeds: [
                baseEmbed('danger')
                    .setTitle('💥 Channel Nuked')
                    .setDescription(`This channel was wiped by <@${moderatorId}>.`),
            ],
        }).catch(() => { });
    },
};
export default command;
//# sourceMappingURL=nuke.js.map