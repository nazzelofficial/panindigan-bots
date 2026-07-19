import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';
import mongoose from 'mongoose';
async function checkDatabase() {
    const start = Date.now();
    try {
        const state = mongoose.connection.readyState;
        if (state !== 1) {
            return { name: 'MongoDB', status: 'down', detail: `Connection state: ${state}` };
        }
        await mongoose.connection.db?.command({ ping: 1 });
        return { name: 'MongoDB', status: 'ok', latencyMs: Date.now() - start };
    }
    catch (err) {
        return { name: 'MongoDB', status: 'down', detail: err.message };
    }
}
async function checkDiscordGateway(client) {
    const ping = client.ws.ping;
    if (ping < 0)
        return { name: 'Discord Gateway', status: 'down', detail: 'No WS ping' };
    if (ping > 500)
        return { name: 'Discord Gateway', status: 'degraded', latencyMs: ping, detail: 'High latency' };
    return { name: 'Discord Gateway', status: 'ok', latencyMs: ping };
}
async function checkShards(client) {
    const shardCount = client.shard?.count ?? 1;
    return {
        name: 'Shards',
        status: 'ok',
        detail: `${shardCount} shard${shardCount !== 1 ? 's' : ''} active`,
    };
}
async function checkMemory() {
    const mem = process.memoryUsage();
    const usedMB = mem.heapUsed / 1024 / 1024;
    const totalMB = mem.heapTotal / 1024 / 1024;
    const pct = (usedMB / totalMB) * 100;
    const status = pct > 90 ? 'degraded' : 'ok';
    return {
        name: 'Memory',
        status,
        detail: `${usedMB.toFixed(1)} MB / ${totalMB.toFixed(1)} MB (${pct.toFixed(1)}%)`,
    };
}
function statusIcon(s) {
    return { ok: '✅', degraded: '⚠️', down: '❌' }[s];
}
export default {
    data: new SlashCommandBuilder()
        .setName('healthcheck')
        .setDescription('Run a full system health check (DB, Gateway, Shards, Memory, Lavalink)'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const client = clientRegistry.get();
        const [dbResult, gwResult, shardResult, memResult] = await Promise.all([
            checkDatabase(),
            checkDiscordGateway(client),
            checkShards(client),
            checkMemory(),
        ]);
        // Attempt Lavalink check if available
        let lavalinkResult;
        try {
            const mgr = client.lavalink;
            if (mgr && typeof mgr.nodeCount !== 'undefined') {
                const connected = typeof mgr.nodeCount === 'function' ? mgr.nodeCount() : mgr.nodeCount;
                lavalinkResult = { name: 'Lavalink', status: connected > 0 ? 'ok' : 'down', detail: `${connected} node(s) connected` };
            }
            else {
                lavalinkResult = { name: 'Lavalink', status: 'degraded', detail: 'Manager not initialized' };
            }
        }
        catch {
            lavalinkResult = { name: 'Lavalink', status: 'down', detail: 'Unreachable' };
        }
        const results = [dbResult, gwResult, shardResult, memResult, lavalinkResult];
        const allOk = results.every(r => r.status === 'ok');
        const anyDown = results.some(r => r.status === 'down');
        const overallColor = anyDown ? '#ff0000' : allOk ? '#00ff00' : '#ff9900';
        const overallStatus = anyDown ? '❌ DEGRADED' : allOk ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️ PARTIAL ISSUES';
        const fields = results.map(r => ({
            name: `${statusIcon(r.status)} ${r.name}`,
            value: [
                `Status: **${r.status.toUpperCase()}**`,
                r.latencyMs !== undefined ? `Latency: ${r.latencyMs}ms` : null,
                r.detail ? r.detail : null,
            ].filter(Boolean).join(' • '),
            inline: false,
        }));
        const embed = new EmbedBuilder()
            .setTitle(`🏥 System Health Check — ${overallStatus}`)
            .setColor(overallColor)
            .addFields(fields)
            .addFields({
            name: '⏱️ Uptime',
            value: (() => {
                const u = process.uptime();
                return `${Math.floor(u / 86400)}d ${Math.floor((u % 86400) / 3600)}h ${Math.floor((u % 3600) / 60)}m ${Math.floor(u % 60)}s`;
            })(),
            inline: true,
        })
            .setTimestamp()
            .setFooter({ text: 'Panindigan Official • Health Check' });
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=healthcheck.js.map