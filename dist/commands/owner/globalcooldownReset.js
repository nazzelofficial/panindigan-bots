import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('globalcooldown_reset')
        .setDescription('Reset all cooldowns for a user')
        .addStringOption(option => option.setName('user_id')
        .setDescription('User ID to reset cooldowns for')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const system = await SystemModel.findOne({});
        const userCooldowns = system?.userCooldowns || {};
        delete userCooldowns[userId];
        await SystemModel.findOneAndUpdate({}, { userCooldowns }, { upsert: true });
        await interaction.reply({ content: `✅ Reset all cooldowns for user ${userId}`, ephemeral: true });
    },
};
//# sourceMappingURL=globalcooldownReset.js.map