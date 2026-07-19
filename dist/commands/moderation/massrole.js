import { infoEmbed, successEmbed } from '../../utils/embeds';
const command = {
    name: 'massrole',
    description: 'Add or remove a role from all members',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 30,
    slashData: (b) => b
        .addRoleOption(option => option.setName('role')
        .setDescription('Role to manage')
        .setRequired(true))
        .addStringOption(option => option.setName('action')
        .setDescription('Add or remove')
        .setRequired(true)
        .addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const role = ctx.isSlash ? ctx.interaction.options.getRole('role', true) : ctx.args[0] ? await guild.roles.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null) : null;
        const action = ctx.isSlash ? ctx.interaction.options.getString('action', true) : ctx.args[1];
        if (!role) {
            await ctx.reply({ embeds: [infoEmbed('Invalid role.')] });
            return;
        }
        if (action !== 'add' && action !== 'remove') {
            await ctx.reply({ embeds: [infoEmbed('Action must be add or remove.')] });
            return;
        }
        await ctx.reply({ embeds: [infoEmbed('Processing mass role action... This may take a while.')] });
        let count = 0;
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            try {
                if (action === 'add' && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role.id);
                    count++;
                }
                else if (action === 'remove' && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role.id);
                    count++;
                }
            }
            catch (error) {
                // Skip if permission error
            }
        }
        await ctx.reply({ embeds: [successEmbed(`${action === 'add' ? 'Added' : 'Removed'} role from ${count} members`)] });
    },
};
export default command;
//# sourceMappingURL=massrole.js.map