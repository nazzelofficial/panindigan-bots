import { UserModel } from '../../database/models/User.js';
import { baseEmbed } from '../../utils/embeds.js';
const command = {
    name: 'level',
    description: 'View your level',
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
        const embed = baseEmbed('primary')
            .setTitle('📊 Level Information')
            .addFields({ name: 'Level', value: level.toString(), inline: true }, { name: 'XP', value: `${xp}/${xpNeeded}`, inline: true }, { name: 'Progress', value: `${Math.floor((xp / xpNeeded) * 100)}%`, inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=level.js.map