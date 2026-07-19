import { ModCaseModel } from '../../database/models/Moderation';
import { baseEmbed, errorEmbed } from '../../utils/embeds';
const command = {
    name: 'kickinfo',
    description: 'View kick history for a user',
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
        const cases = await ModCaseModel.find({ userId: user.id, guildId: guild.id, type: 'kick' });
        if (cases.length === 0) {
            await ctx.reply({ embeds: [errorEmbed('No kick history found for this user')] });
            return;
        }
        const embed = baseEmbed('warning')
            .setTitle('👢 Kick History')
            .setDescription(cases.map(c => `**${new Date(c.createdAt).toLocaleString()}**: ${c.reason}`).join('\n'))
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=kickinfo.js.map