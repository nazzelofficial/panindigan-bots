import { successEmbed } from '../../utils/embeds.js';
const command = {
    name: 'dehoist',
    description: 'Remove special characters from nicknames',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to dehoist')
        .setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.args[0] ? await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null) : null;
        if (targetUser) {
            const member = await guild.members.fetch(targetUser.id);
            const cleanName = member.displayName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || member.user.username;
            await member.setNickname(cleanName);
            await ctx.reply({ embeds: [successEmbed(`Dehoisted ${member.user.tag}`)] });
        }
        else {
            let count = 0;
            const members = await guild.members.fetch();
            for (const member of members.values()) {
                const cleanName = member.displayName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                if (cleanName !== member.displayName) {
                    await member.setNickname(cleanName || member.user.username).catch(() => { });
                    count++;
                }
            }
            await ctx.reply({ embeds: [successEmbed(`Dehoisted ${count} members`)] });
        }
    },
};
export default command;
//# sourceMappingURL=dehoist.js.map