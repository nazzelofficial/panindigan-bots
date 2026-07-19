import { UserModel } from '@/database/models/User';
import { successEmbed } from '@/utils/embeds';
const command = {
    name: 'xp_remove',
    description: 'Remove XP from a user (admin only)',
    category: 'Leveling',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to remove XP from')
        .setRequired(true))
        .addIntegerOption(option => option.setName('amount')
        .setDescription('Amount of XP to remove')
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
        profile.xp = Math.max(0, (profile.xp || 0) - amount);
        profile.totalXp = Math.max(0, (profile.totalXp || 0) - amount);
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`Removed ${amount} XP from ${targetUser.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=xpRemove.js.map