import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('shardping')
        .setDescription('View bot latency for specific shard')
        .addIntegerOption(option => option.setName('shard')
        .setDescription('Specific shard ID to check')
        .setRequired(false)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const client = clientRegistry.get();
        const shardId = interaction.options.getInteger('shard');
        const wsPing = client.ws.ping;
        const apiPing = Date.now() - interaction.createdTimestamp;
        let shardPing = 'N/A';
        if (shardId !== null && client.shard) {
            const shardPingResult = await client.shard.broadcastEval((c, { id }) => {
                if (c.shard?.ids.includes(id))
                    return c.ws.ping;
                return null;
            }, { context: { id: shardId } });
            shardPing = shardPingResult.filter(p => p !== null)[0]?.toString() || 'N/A';
        }
        const embed = new EmbedBuilder()
            .setTitle('🏓 Bot Latency')
            .setColor('#00ff00')
            .addFields({ name: 'WebSocket Ping', value: `${wsPing}ms`, inline: true }, { name: 'API Latency', value: `${apiPing}ms`, inline: true }, { name: 'Shard Ping', value: shardPing, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=ping.js.map