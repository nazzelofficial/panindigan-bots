import { SlashCommandBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium.js';
export default {
    data: new SlashCommandBuilder()
        .setName('premium_downgrade')
        .setDescription('Downgrade the Premium tier of a server')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Server ID')
        .setRequired(true))
        .addStringOption(option => option.setName('tier')
        .setDescription('Premium tier')
        .setRequired(true)
        .addChoices({ name: 'Basic', value: 'basic' }, { name: 'Standard', value: 'standard' }, { name: 'Gold', value: 'gold' })),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id', true);
        const tier = interaction.options.getString('tier', true);
        const existing = await PremiumModel.findOne({ guildId: serverId });
        if (!existing) {
            return interaction.reply({ content: '❌ Server does not have Premium', ephemeral: true });
        }
        existing.tier = tier;
        await existing.save();
        await interaction.reply({
            content: `✅ Downgraded server ${serverId} to ${tier.toUpperCase()} Premium`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=premiumDowngrade.js.map