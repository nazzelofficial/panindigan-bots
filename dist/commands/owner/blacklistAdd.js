import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('blacklist_add')
        .setDescription('Blacklist a server or user')
        .addStringOption(option => option.setName('type')
        .setDescription('Type to blacklist')
        .setRequired(true)
        .addChoices({ name: 'Server', value: 'server' }, { name: 'User', value: 'user' }))
        .addStringOption(option => option.setName('id')
        .setDescription('Server or User ID')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Reason for blacklist')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const type = interaction.options.getString('type', true);
        const id = interaction.options.getString('id', true);
        const reason = interaction.options.getString('reason', true);
        const system = await SystemModel.findOne({});
        const blacklists = system?.blacklists || { servers: [], users: [] };
        if (type === 'server') {
            if (blacklists.servers.includes(id)) {
                return interaction.reply({ content: '❌ Server is already blacklisted', ephemeral: true });
            }
            blacklists.servers.push(id);
        }
        else {
            if (blacklists.users.includes(id)) {
                return interaction.reply({ content: '❌ User is already blacklisted', ephemeral: true });
            }
            blacklists.users.push(id);
        }
        await SystemModel.findOneAndUpdate({}, { blacklists }, { upsert: true });
        await interaction.reply({
            content: `✅ Blacklisted ${type} ${id}: ${reason}`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=blacklistAdd.js.map