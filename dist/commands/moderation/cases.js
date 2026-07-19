import { ModCaseModel } from '@/database/models/Moderation';
import { baseEmbed, errorEmbed } from '@/utils/embeds';
const command = {
    name: 'cases',
    description: 'View moderation cases for a user',
    category: 'Moderation',
    access: 'moderator',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to check cases for')
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
        const cases = await ModCaseModel.find({ userId: user.id, guildId: guild.id });
        if (cases.length === 0) {
            await ctx.reply({ embeds: [errorEmbed('No moderation cases found for this user')] });
            return;
        }
        const embed = baseEmbed('primary')
            .setTitle('📋 Moderation Cases')
            .setDescription(cases.map(c => `**${c.type}**: ${c.reason} - ${new Date(c.createdAt).toLocaleString()}`).join('\n'))
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=cases.js.map