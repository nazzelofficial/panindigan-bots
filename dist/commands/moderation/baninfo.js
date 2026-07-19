import { baseEmbed, errorEmbed } from '@/utils/embeds';
const command = {
    name: 'baninfo',
    description: 'View information about a ban',
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
        try {
            const bans = await guild.bans.fetch();
            const ban = bans.get(user.id);
            if (!ban) {
                await ctx.reply({ embeds: [errorEmbed('User is not banned')] });
                return;
            }
            const embed = baseEmbed('danger')
                .setTitle('🚫 Ban Information')
                .addFields({ name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true }, { name: 'Reason', value: ban.reason || 'No reason provided', inline: true }, { name: 'Banned At', value: new Date().toLocaleString(), inline: true })
                .setTimestamp();
            await ctx.reply({ embeds: [embed] });
        }
        catch (error) {
            await ctx.reply({ embeds: [errorEmbed(`Error fetching ban info: ${error.message}`)] });
        }
    },
};
export default command;
//# sourceMappingURL=baninfo.js.map