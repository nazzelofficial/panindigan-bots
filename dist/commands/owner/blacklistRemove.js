import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('blacklist_remove')
        .setDescription('Remove a blacklisted server or user')
        .addStringOption(option => option.setName('type')
        .setDescription('Type to remove from blacklist')
        .setRequired(true)
        .addChoices({ name: 'Server', value: 'server' }, { name: 'User', value: 'user' }))
        .addStringOption(option => option.setName('id')
        .setDescription('Server or User ID')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const type = interaction.options.getString('type', true);
        const id = interaction.options.getString('id', true);
        const system = await SystemModel.findOne({});
        const blacklists = system?.blacklists || { servers: [], users: [] };
        if (type === 'server') {
            if (!blacklists.servers.includes(id)) {
                return interaction.reply({ content: '❌ Server is not blacklisted', ephemeral: true });
            }
            blacklists.servers = blacklists.servers.filter((s) => s !== id);
        }
        else {
            if (!blacklists.users.includes(id)) {
                return interaction.reply({ content: '❌ User is not blacklisted', ephemeral: true });
            }
            blacklists.users = blacklists.users.filter((u) => u !== id);
        }
        await SystemModel.findOneAndUpdate({}, { blacklists }, { upsert: true });
        await interaction.reply({
            content: `✅ Removed ${type} ${id} from blacklist`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=blacklistRemove.js.map