import { baseEmbed, errorEmbed } from '../../utils/embeds';
const command = {
    name: 'muteinfo',
    description: 'View information about a mute',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to check')
        .setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = ctx.isSlash ? ctx.interaction.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed('Invalid user.')] });
            return;
        }
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed('User not in server')] });
            return;
        }
        if (!member.isCommunicationDisabled()) {
            await ctx.reply({ embeds: [errorEmbed('User is not muted')] });
            return;
        }
        const embed = baseEmbed('danger')
            .setTitle('🔇 Mute Information')
            .addFields({ name: 'User', value: member.user.tag, inline: true }, { name: 'Status', value: 'Muted', inline: true }, { name: 'Communication Disabled', value: 'Yes', inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=muteinfo.js.map