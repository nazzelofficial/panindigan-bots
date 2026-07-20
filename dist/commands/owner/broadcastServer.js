import { SlashCommandBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('broadcast_server')
        .setDescription('Send a message to a specific server')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Server ID')
        .setRequired(true))
        .addStringOption(option => option.setName('message')
        .setDescription('Message to send')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id', true);
        const message = interaction.options.getString('message', true);
        const client = clientRegistry.get();
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return interaction.reply({ content: '❌ Bot is not in that server', ephemeral: true });
        }
        try {
            const channel = guild.systemChannel || guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
            if (channel && 'send' in channel) {
                await channel.send(message);
                await interaction.reply({ content: `✅ Message sent to ${guild.name}`, ephemeral: true });
            }
            else {
                await interaction.reply({ content: '❌ No suitable channel found', ephemeral: true });
            }
        }
        catch (error) {
            await interaction.reply({ content: `❌ Failed to send message: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=broadcastServer.js.map