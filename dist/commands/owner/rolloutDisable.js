import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('rollout_disable')
        .setDescription('Disable a feature rollout')
        .addStringOption(option => option.setName('feature')
        .setDescription('Feature name')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const feature = interaction.options.getString('feature', true);
        const system = await SystemModel.findOne({});
        const rollouts = system?.rollouts || {};
        if (!rollouts[feature]) {
            return interaction.reply({ content: '❌ Feature rollout not found', ephemeral: true });
        }
        rollouts[feature].enabled = false;
        rollouts[feature].disabledAt = new Date();
        await SystemModel.findOneAndUpdate({}, { rollouts }, { upsert: true });
        await interaction.reply({ content: `✅ Disabled ${feature} rollout`, ephemeral: true });
    },
};
//# sourceMappingURL=rolloutDisable.js.map