import { baseEmbed, errorEmbed } from '../../utils/embeds.js';
const command = {
    name: 'lockinfo',
    description: 'Check lock status of a channel',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addChannelOption(option => option.setName('channel')
        .setDescription('Channel to check')
        .setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.isSlash ? ctx.interaction.options.getChannel('channel') : ctx.args[0] ? await guild.channels.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null) : ctx.message?.channel;
        if (!channel || !('permissionOverwrites' in channel)) {
            await ctx.reply({ embeds: [errorEmbed('Invalid channel')] });
            return;
        }
        const everyoneRole = guild.roles.everyone;
        const perms = channel.permissionOverwrites.cache.get(everyoneRole.id);
        const isLocked = perms?.deny.has('SendMessages') || false;
        const embed = baseEmbed(isLocked ? 'danger' : 'success')
            .setTitle('🔒 Lock Status')
            .addFields({ name: 'Channel', value: channel.toString(), inline: true }, { name: 'Status', value: isLocked ? 'Locked' : 'Unlocked', inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=lockinfo.js.map