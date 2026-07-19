import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';
export default {
    data: new SlashCommandBuilder()
        .setName('servers_top')
        .setDescription('Show the largest servers using the bot'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const client = clientRegistry.get();
        const sortedServers = Array.from(client.guilds.cache.values())
            .sort((a, b) => b.memberCount - a.memberCount)
            .slice(0, 20);
        const embed = new EmbedBuilder()
            .setTitle('📊 Top 20 Largest Servers')
            .setColor('#00ff00')
            .setDescription(sortedServers.map((guild, index) => `${index + 1}. **${guild.name}** - ${guild.memberCount} members (ID: ${guild.id})`).join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=serversTop.js.map