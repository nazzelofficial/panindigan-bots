import { UserModel } from '../../database/models/User.js';
import { successEmbed } from '../../utils/embeds.js';
const command = {
    name: 'xp_add',
    description: 'Add XP to a user (admin only)',
    category: 'Leveling',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to add XP to')
        .setRequired(true))
        .addIntegerOption(option => option.setName('amount')
        .setDescription('Amount of XP to add')
        .setRequired(true)
        .setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger('amount', true) : parseInt(ctx.args[1] ?? '0');
        if (!targetUser) {
            await ctx.reply({ embeds: [successEmbed('Invalid user.')] });
            return;
        }
        const user = await UserModel.findOneAndUpdate({ userId: targetUser.id }, { $setOnInsert: { userId: targetUser.id } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.xp = (profile.xp || 0) + amount;
        profile.totalXp = (profile.totalXp || 0) + amount;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`Added ${amount} XP to ${targetUser.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=xpAdd.js.map