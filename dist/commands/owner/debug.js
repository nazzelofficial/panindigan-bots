import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Enable or disable debug mode for specific modules')
        .addStringOption(option => option.setName('module')
        .setDescription('Module to debug')
        .setRequired(false))
        .addBooleanOption(option => option.setName('off')
        .setDescription('Disable debug mode')
        .setRequired(false)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const module = interaction.options.getString('module');
        const off = interaction.options.getBoolean('off');
        if (off === true) {
            await SystemModel.findOneAndUpdate({}, { debugMode: false, debugModule: null }, { upsert: true });
            await interaction.reply({ content: '✅ Debug mode disabled', ephemeral: true });
        }
        else if (module) {
            await SystemModel.findOneAndUpdate({}, { debugMode: true, debugModule: module }, { upsert: true });
            await interaction.reply({ content: `✅ Debug mode enabled for module: ${module}`, ephemeral: true });
        }
        else {
            const system = await SystemModel.findOne({});
            if (system?.debugMode) {
                await interaction.reply({ content: `🔍 Debug mode is ON for module: ${system?.debugModule ?? 'unknown'}`, ephemeral: true });
            }
            else {
                await interaction.reply({ content: '🔍 Debug mode is OFF', ephemeral: true });
            }
        }
    },
};
//# sourceMappingURL=debug.js.map