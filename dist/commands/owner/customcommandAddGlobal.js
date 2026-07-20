import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('customcommand_add_global')
        .setDescription('Add a global custom command')
        .addStringOption(option => option.setName('name')
        .setDescription('Command name')
        .setRequired(true))
        .addStringOption(option => option.setName('response')
        .setDescription('Command response')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const name = interaction.options.getString('name', true);
        const response = interaction.options.getString('response', true);
        const system = await SystemModel.findOne({});
        const globalCustomCommands = system?.globalCustomCommands || {};
        globalCustomCommands[name] = response;
        await SystemModel.findOneAndUpdate({}, { globalCustomCommands }, { upsert: true });
        await interaction.reply({ content: `✅ Added global custom command: ${name}`, ephemeral: true });
    },
};
//# sourceMappingURL=customcommandAddGlobal.js.map