import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('globalban_check')
        .setDescription('Check if a user is globally banned')
        .addStringOption(option => option.setName('user_id')
        .setDescription('User ID to check')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const system = await SystemModel.findOne({});
        const globalBans = system?.globalBans || [];
        const isBanned = globalBans.includes(userId);
        await interaction.reply({
            content: isBanned ? `✅ User ${userId} is globally banned` : `❌ User ${userId} is not globally banned`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=globalbanCheck.js.map