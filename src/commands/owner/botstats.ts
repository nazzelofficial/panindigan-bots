import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, version as djsVersion } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';
import os from 'node:os';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('View complete bot performance statistics (RAM, CPU, uptime, shards, guilds)'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const client = clientRegistry.get()!;
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const shardCount = client.shard?.count ?? 1;
    const shardId = client.shard?.ids?.[0] ?? 0;

    // System-level memory
    const totalSystemMem = os.totalmem();
    const freeSystemMem = os.freemem();
    const usedSystemMem = totalSystemMem - freeSystemMem;

    // CPU model
    const cpuInfo = os.cpus();
    const cpuModel = cpuInfo[0]?.model ?? 'Unknown CPU';
    const cpuCores = cpuInfo.length;

    // Bot metrics
    const totalServers = client.guilds.cache.size;
    const totalChannels = client.channels.cache.size;
    const cachedUsers = client.users.cache.size;
    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
    const wsPing = client.ws.ping;

    const embed = new EmbedBuilder()
      .setTitle('📊 Panindigan — Bot Performance Statistics')
      .setColor('#5865F2')
      .setThumbnail(client.user?.displayAvatarURL() ?? null)
      .addFields(
        // === Discord ===
        { name: '🌐 Bot', value: `${client.user?.tag ?? 'Unknown'}`, inline: true },
        { name: '⚡ WS Ping', value: `${wsPing}ms`, inline: true },
        { name: '🔧 Discord.js', value: `v${djsVersion ?? '?'}`, inline: true },

        // === Sharding ===
        { name: '🔀 Shard ID', value: `#${shardId}`, inline: true },
        { name: '🔀 Shard Count', value: shardCount.toString(), inline: true },
        { name: '🏠 Servers (this shard)', value: totalServers.toLocaleString(), inline: true },

        // === Community ===
        { name: '👥 Total Members', value: totalMembers.toLocaleString(), inline: true },
        { name: '👤 Cached Users', value: cachedUsers.toLocaleString(), inline: true },
        { name: '📢 Channels', value: totalChannels.toLocaleString(), inline: true },

        // === Performance ===
        { name: '⏱️ Bot Uptime', value: formatUptime(uptime), inline: true },
        { name: '🖥️ OS Uptime', value: formatUptime(os.uptime()), inline: true },
        { name: '🟩 Node.js', value: process.version, inline: true },

        // === Memory ===
        { name: '💾 Heap Used', value: formatBytes(mem.heapUsed), inline: true },
        { name: '💾 Heap Total', value: formatBytes(mem.heapTotal), inline: true },
        { name: '💾 RSS', value: formatBytes(mem.rss), inline: true },

        // === System ===
        { name: '🖥️ System RAM', value: `${formatBytes(usedSystemMem)} / ${formatBytes(totalSystemMem)}`, inline: true },
        { name: '🧮 CPU', value: `${cpuModel} (${cpuCores} cores)`, inline: false },
        { name: '🖥️ Platform', value: `${os.type()} ${os.release()} — ${os.arch()}`, inline: false },
      )
      .setTimestamp()
      .setFooter({ text: 'Panindigan Official • Bot Statistics' });

    await interaction.editReply({ embeds: [embed] });
  },
}
