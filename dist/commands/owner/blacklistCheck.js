import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('blacklist_check')
        .setDescription('Check if a server or user is blacklisted')
        .addStringOption(option => option.setName('id')
        .setDescription('Server or User ID to check')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const id = interaction.options.getString('id', true);
        const system = await SystemModel.findOne({});
        const blacklists = system?.blacklists || { servers: [], users: [] };
        const isBlacklisted = blacklists.servers.includes(id) || blacklists.users.includes(id);
        const type = blacklists.servers.includes(id) ? 'server' : blacklists.users.includes(id) ? 'user' : null;
        await interaction.reply({
            content: isBlacklisted ? `✅ ${id} is blacklisted as a ${type}` : `❌ ${id} is not blacklisted`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=blacklistCheck.js.map