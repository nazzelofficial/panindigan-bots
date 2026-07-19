import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('Enable or disable maintenance mode')
        .addSubcommand(subcommand => subcommand.setName('on')
        .setDescription('Enable maintenance mode')
        .addStringOption(option => option.setName('reason')
        .setDescription('Reason for maintenance')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand.setName('off')
        .setDescription('Disable maintenance mode'))
        .addSubcommand(subcommand => subcommand.setName('message')
        .setDescription('Set maintenance message')
        .addStringOption(option => option.setName('message')
        .setDescription('Maintenance message')
        .setRequired(true))),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'on') {
            const reason = interaction.options.getString('reason') || 'Scheduled maintenance';
            await SystemModel.findOneAndUpdate({}, { maintenanceMode: true, maintenanceReason: reason }, { upsert: true });
            await interaction.reply({ content: `✅ Maintenance mode enabled: ${reason}`, ephemeral: true });
        }
        else if (subcommand === 'off') {
            await SystemModel.findOneAndUpdate({}, { maintenanceMode: false, maintenanceReason: null }, { upsert: true });
            await interaction.reply({ content: '✅ Maintenance mode disabled', ephemeral: true });
        }
        else if (subcommand === 'message') {
            const message = interaction.options.getString('message', true);
            await SystemModel.findOneAndUpdate({}, { maintenanceMessage: message }, { upsert: true });
            await interaction.reply({ content: `✅ Maintenance message set: ${message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=maintenance.js.map