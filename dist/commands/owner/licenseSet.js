import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('license_set')
        .setDescription('Set bot license key')
        .addStringOption(option => option.setName('key')
        .setDescription('License key')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const key = interaction.options.getString('key', true);
        const system = await SystemModel.findOne({});
        const license = system?.license || { type: 'Standard', expires: 'Never', features: ['all'] };
        license.key = key;
        await SystemModel.findOneAndUpdate({}, { license }, { upsert: true });
        await interaction.reply({ content: '✅ License key updated', ephemeral: true });
    },
};
//# sourceMappingURL=licenseSet.js.map