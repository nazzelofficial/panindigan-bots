import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('analytics_reset')
        .setDescription('Reset analytics data')
        .addStringOption(option => option.setName('type')
        .setDescription('Data to reset')
        .setRequired(true)
        .addChoices({ name: 'Daily', value: 'daily' }, { name: 'Weekly', value: 'weekly' }, { name: 'Monthly', value: 'monthly' }, { name: 'All', value: 'all' })),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const type = interaction.options.getString('type', true);
        const system = await SystemModel.findOne({});
        const analytics = system?.analytics || {
            totalCommands: 0,
            totalServers: 0,
            totalUsers: 0,
            dailyCommands: 0,
            weeklyCommands: 0,
            monthlyCommands: 0
        };
        switch (type) {
            case 'daily':
                analytics.dailyCommands = 0;
                break;
            case 'weekly':
                analytics.weeklyCommands = 0;
                break;
            case 'monthly':
                analytics.monthlyCommands = 0;
                break;
            case 'all':
                analytics.dailyCommands = 0;
                analytics.weeklyCommands = 0;
                analytics.monthlyCommands = 0;
                break;
        }
        await SystemModel.findOneAndUpdate({}, { analytics }, { upsert: true });
        await interaction.reply({ content: `✅ Reset ${type} analytics`, ephemeral: true });
    },
};
//# sourceMappingURL=analyticsReset.js.map