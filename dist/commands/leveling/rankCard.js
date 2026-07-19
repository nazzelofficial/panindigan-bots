import { UserModel } from '../../database/models/User';
import { baseEmbed } from '../../utils/embeds';
const command = {
    name: 'rank_card',
    description: 'View your rank card',
    category: 'Leveling',
    access: 'general',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = await UserModel.findOne({ userId: ctx.userId });
        let profile = user?.guilds.find((g) => g.guildId === guild.id);
        const level = profile?.level || 0;
        const xp = profile?.xp || 0;
        const xpNeeded = level * 100 || 100;
        const progress = Math.floor((xp / xpNeeded) * 100);
        const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
        const avatar = ctx.isSlash ? ctx.interaction.user.displayAvatarURL() : ctx.message.author.displayAvatarURL();
        const tag = ctx.isSlash ? ctx.interaction.user.tag : ctx.message.author.tag;
        const embed = baseEmbed('primary')
            .setTitle('🎴 Rank Card')
            .setThumbnail(avatar)
            .addFields({ name: 'User', value: tag, inline: true }, { name: 'Level', value: level.toString(), inline: true }, { name: 'XP Progress', value: `${progressBar} ${progress}%`, inline: false })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=rankCard.js.map