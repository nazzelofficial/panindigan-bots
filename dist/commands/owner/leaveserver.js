import { SlashCommandBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('leaveserver')
        .setDescription('Remove the bot from a server')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Server ID to leave')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Reason for leaving')
        .setRequired(false)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id', true);
        const reason = interaction.options.getString('reason');
        const client = clientRegistry.get();
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return interaction.reply({ content: '❌ Bot is not in that server', ephemeral: true });
        }
        await interaction.reply({ content: `🚪 Leaving server: ${guild.name}...`, ephemeral: true });
        try {
            await guild.leave();
            if (reason) {
                try {
                    const channel = guild.systemChannel || guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));
                    if (channel && 'send' in channel) {
                        await channel.send(`👋 Bot is leaving this server. Reason: ${reason}`);
                    }
                }
                catch (error) {
                    // Ignore if we can't send message
                }
            }
            await interaction.followUp({ content: `✅ Successfully left server: ${guild.name}`, ephemeral: true });
        }
        catch (error) {
            await interaction.followUp({ content: `❌ Failed to leave server: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=leaveserver.js.map