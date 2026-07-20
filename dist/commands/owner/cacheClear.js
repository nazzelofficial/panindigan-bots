import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('cache_clear')
        .setDescription('Clear bot cache')
        .addStringOption(option => option.setName('type')
        .setDescription('Cache type to clear')
        .setRequired(true)
        .addChoices({ name: 'All', value: 'all' }, { name: 'Users', value: 'users' }, { name: 'Guilds', value: 'guilds' }, { name: 'Channels', value: 'channels' }, { name: 'Messages', value: 'messages' })),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const type = interaction.options.getString('type', true);
        const client = interaction.client;
        await interaction.reply({ content: '🧹 Clearing cache...', ephemeral: true });
        try {
            switch (type) {
                case 'all':
                    client.users.cache.clear();
                    client.guilds.cache.clear();
                    client.channels.cache.clear();
                    break;
                case 'users':
                    client.users.cache.clear();
                    break;
                case 'guilds':
                    client.guilds.cache.clear();
                    break;
                case 'channels':
                    client.channels.cache.clear();
                    break;
                case 'messages':
                    // Message cache is per-channel
                    break;
            }
            await interaction.followUp({ content: `✅ Cleared ${type} cache`, ephemeral: true });
        }
        catch (error) {
            await interaction.followUp({ content: `❌ Failed to clear cache: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=cacheClear.js.map