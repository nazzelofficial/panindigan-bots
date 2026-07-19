import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';
export default {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announce to a specific server system')
        .addStringOption(option => option.setName('server_id')
        .setDescription('Server ID')
        .setRequired(true))
        .addStringOption(option => option.setName('message')
        .setDescription('Announcement message')
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
                const embed = new EmbedBuilder()
                    .setTitle('📢 Announcement')
                    .setDescription(message)
                    .setColor('#ffd700')
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: `✅ Announcement sent to ${guild.name}`, ephemeral: true });
            }
            else {
                await interaction.reply({ content: '❌ No suitable channel found', ephemeral: true });
            }
        }
        catch (error) {
            await interaction.reply({ content: `❌ Failed to send announcement: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=announce.js.map