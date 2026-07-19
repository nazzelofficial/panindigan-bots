import { UserModel } from '../../database/models/User';
import { baseEmbed } from '../../utils/embeds';
const command = {
    name: 'leveling_stats',
    description: 'View leveling statistics',
    category: 'Leveling',
    access: 'admin',
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const allUsers = await UserModel.find({});
        const guildUsers = allUsers.filter((u) => u.guilds.some((g) => g.guildId === guild.id));
        const totalUsers = guildUsers.length;
        let highestLevel = 0;
        let totalLevel = 0;
        guildUsers.forEach((u) => {
            const profile = u.guilds.find((g) => g.guildId === guild.id);
            if (profile) {
                const level = profile.level || 0;
                if (level > highestLevel)
                    highestLevel = level;
                totalLevel += level;
            }
        });
        const averageLevel = totalUsers > 0 ? Math.floor(totalLevel / totalUsers) : 0;
        const embed = baseEmbed('primary')
            .setTitle('📊 Leveling Statistics')
            .addFields({ name: 'Total Users', value: totalUsers.toString(), inline: true }, { name: 'Highest Level', value: highestLevel.toString(), inline: true }, { name: 'Average Level', value: averageLevel.toString(), inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=levelingStats.js.map