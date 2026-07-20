import { UserModel } from '../../database/models/User.js';
import { successEmbed } from '../../utils/embeds.js';
const command = {
    name: 'level_set',
    description: 'Set user level (admin only)',
    category: 'Leveling',
    access: 'admin',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption(option => option.setName('user')
        .setDescription('User to set level for')
        .setRequired(true))
        .addIntegerOption(option => option.setName('level')
        .setDescription('Level to set')
        .setRequired(true)
        .setMinValue(0)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
        const level = ctx.isSlash ? ctx.interaction.options.getInteger('level', true) : parseInt(ctx.args[1] ?? '0');
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
        profile.level = level;
        profile.xp = 0;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`Set ${targetUser.tag}'s level to ${level}`)] });
    },
};
export default command;
//# sourceMappingURL=levelSet.js.map