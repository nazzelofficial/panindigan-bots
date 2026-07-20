import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
export default {
    data: new SlashCommandBuilder()
        .setName('shards')
        .setDescription('View status and health of all bot shards'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const client = clientRegistry.get();
        if (!client.shard) {
            return interaction.reply({ content: '❌ Bot is not sharded', ephemeral: true });
        }
        const shardStatus = await client.shard.broadcastEval(c => ({
            id: c.shard?.ids[0],
            status: c.ws.status,
            ping: c.ws.ping,
            guilds: c.guilds.cache.size,
            ready: c.isReady()
        }));
        const embed = new EmbedBuilder()
            .setTitle('🔮 Shard Status')
            .setColor('#00ff00')
            .setDescription(shardStatus.map(s => `Shard ${s.id}: ${s.status} | ${s.ping}ms | ${s.guilds} guilds | ${s.ready ? '✅ Ready' : '❌ Not Ready'}`).join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=shards.js.map