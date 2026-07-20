import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('enable_global')
        .setDescription('Enable a globally disabled command')
        .addStringOption(option => option.setName('command')
        .setDescription('Command name to enable')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const command = interaction.options.getString('command', true);
        const system = await SystemModel.findOne({});
        const disabledCommands = system?.globalDisabledCommands || [];
        if (!disabledCommands.includes(command)) {
            return interaction.reply({ content: '❌ Command is not globally disabled', ephemeral: true });
        }
        const newDisabled = disabledCommands.filter((c) => c !== command);
        await SystemModel.findOneAndUpdate({}, { disabledGlobalCommands: newDisabled }, { upsert: true });
        await interaction.reply({ content: `✅ Globally enabled command: ${command}`, ephemeral: true });
    },
};
//# sourceMappingURL=enableGlobal.js.map