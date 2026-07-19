import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('analytics_view')
        .setDescription('View bot usage analytics'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const analytics = system?.analytics || {
            totalCommands: 0,
            totalServers: 0,
            totalUsers: 0,
            dailyCommands: 0,
            weeklyCommands: 0,
            monthlyCommands: 0
        };
        const embed = new EmbedBuilder()
            .setTitle('📊 Bot Analytics')
            .setColor('#00ff00')
            .addFields({ name: 'Total Commands', value: analytics.totalCommands.toString(), inline: true }, { name: 'Total Servers', value: analytics.totalServers.toString(), inline: true }, { name: 'Total Users', value: analytics.totalUsers.toString(), inline: true }, { name: 'Daily Commands', value: analytics.dailyCommands.toString(), inline: true }, { name: 'Weekly Commands', value: analytics.weeklyCommands.toString(), inline: true }, { name: 'Monthly Commands', value: analytics.monthlyCommands.toString(), inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=analyticsView.js.map