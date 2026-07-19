import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, version as djsVersion } from 'discord.js';
import { PremiumModel, ServerPackModel } from '../../database/models/Premium';
import { clientRegistry } from '../../structures/clientRegistry';

// Standard tier prices as defined in docs (used for revenue estimation per grant event)
const TIER_PRICES: Record<string, number> = { basic: 50, standard: 150, gold: 350, enterprise: 600 };
const PACK_PRICES: Record<string, number> = { pack3: 499, pack5: 799, pack10: 1199 };

export default {
  data: new SlashCommandBuilder()
    .setName('globalstats')
    .setDescription('View complete network statistics for the entire bot')
    .addSubcommand(sub =>
      sub.setName('overview')
        .setDescription('Full network overview (servers, users, shard info, memory)'))
    .addSubcommand(sub =>
      sub.setName('commands')
        .setDescription('Loaded command breakdown by category across the bot'))
    .addSubcommand(sub =>
      sub.setName('growth')
        .setDescription('Server list sorted by most recently joined'))
    .addSubcommand(sub =>
      sub.setName('revenue')
        .setDescription('Revenue report derived from Premium grant/refund history')),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const client = clientRegistry.get()!;

    await interaction.deferReply({ ephemeral: true });

    if (sub === 'overview') {
      const totalServers = client.guilds.cache.size;
      const totalMembers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
      const totalChannels = client.channels.cache.size;
      const uptime = process.uptime();
      const uptimeStr = `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
      const shardCount = client.shard?.count ?? 1;
      const memory = process.memoryUsage();
      const ramMB = (memory.heapUsed / 1024 / 1024).toFixed(1);
      const premiumCount = await PremiumModel.countDocuments({ active: true });
      const totalCommandsLoaded = client.commands.size;

      const embed = new EmbedBuilder()
        .setTitle('🌐 Panindigan — Global Network Statistics')
        .setColor('#5865F2')
        .addFields(
          { name: '🏠 Servers', value: totalServers.toLocaleString(), inline: true },
          { name: '👥 Total Members', value: totalMembers.toLocaleString(), inline: true },
          { name: '📢 Channels', value: totalChannels.toLocaleString(), inline: true },
          { name: '🔧 Shards', value: shardCount.toString(), inline: true },
          { name: '⏱️ Uptime', value: uptimeStr, inline: true },
          { name: '💾 RAM', value: `${ramMB} MB`, inline: true },
          { name: '⚡ Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '💎 Premium Servers', value: premiumCount.toLocaleString(), inline: true },
          { name: '📋 Commands Loaded', value: totalCommandsLoaded.toLocaleString(), inline: true },
          { name: '📦 discord.js', value: `v${djsVersion ?? '?'}`, inline: true },
          { name: '🟩 Node.js', value: process.version, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Panindigan Official • Global Stats' });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'commands') {
      // Tally loaded commands by category
      const byCategory = new Map<string, string[]>();
      for (const [name, cmd] of client.commands.entries()) {
        const cat = (cmd.category ?? 'Uncategorized').toLowerCase();
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(name);
      }

      const sorted = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);

      const fields = sorted.map(([cat, names]) => ({
        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${names.length})`,
        value: names.slice(0, 20).map(n => `\`${n}\``).join(', ') + (names.length > 20 ? ` *+${names.length - 20} more*` : ''),
        inline: false,
      }));

      const embed = new EmbedBuilder()
        .setTitle(`📋 Loaded Commands — ${client.commands.size} total`)
        .setColor('#5865F2')
        .addFields(fields.slice(0, 10)) // Discord limit: 25 fields
        .setDescription('*Command usage analytics require a persistent tracking middleware — this view shows what is currently registered and loaded.*')
        .setTimestamp()
        .setFooter({ text: 'Panindigan Official • Command Registry' });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'growth') {
      const totalServers = client.guilds.cache.size;
      const sorted = [...client.guilds.cache.values()].sort((a, b) => (b.joinedTimestamp ?? 0) - (a.joinedTimestamp ?? 0));
      const newest10 = sorted.slice(0, 10).map(g =>
        `• **${g.name}** (${g.memberCount.toLocaleString()} members) — joined <t:${Math.floor((g.joinedTimestamp ?? 0) / 1000)}:R>`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📈 Server Growth — Bot Network')
        .setColor('#5865F2')
        .addFields(
          { name: '🏠 Total Servers', value: totalServers.toLocaleString(), inline: true },
          { name: '🆕 10 Most Recently Added', value: newest10 || 'N/A', inline: false },
        )
        .setDescription('*Showing the 10 most recently added servers sorted by bot join date.*')
        .setTimestamp()
        .setFooter({ text: 'Panindigan Official • Growth Analytics' });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'revenue') {
      // Use history entries to count actual grant events and refunds per tier
      const premiums = await PremiumModel.find({}).lean() as any[];
      const packs = await ServerPackModel.find({ active: true }).lean() as any[];

      const grantCounts: Record<string, number> = { basic: 0, standard: 0, gold: 0, enterprise: 0 };
      const refundCounts: Record<string, number> = { basic: 0, standard: 0, gold: 0, enterprise: 0 };

      for (const p of premiums) {
        for (const h of (p.history ?? []) as any[]) {
          const tier = (h.tier as string) ?? p.tier;
          if (h.action === 'grant' && tier in grantCounts) {
            grantCounts[tier]++;
          } else if (h.action === 'refund' && tier in refundCounts) {
            refundCounts[tier]++;
          }
        }
      }

      const grossRevenue = Object.entries(grantCounts).reduce((sum, [tier, count]) => sum + (TIER_PRICES[tier] ?? 0) * count, 0);
      const refundTotal = Object.entries(refundCounts).reduce((sum, [tier, count]) => sum + (TIER_PRICES[tier] ?? 0) * count, 0);
      const packRevenue = packs.reduce((sum: number, p: any) => sum + (PACK_PRICES[p.packType as string] ?? 0), 0);
      const netRevenue = grossRevenue + packRevenue - refundTotal;

      const embed = new EmbedBuilder()
        .setTitle('💰 Revenue Report — Premium Grant History')
        .setColor('#FFD700')
        .addFields(
          { name: '📊 Gross Revenue (PHP)', value: `₱${(grossRevenue + packRevenue).toLocaleString()}`, inline: true },
          { name: '↩️ Refunds (PHP)', value: `₱${refundTotal.toLocaleString()}`, inline: true },
          { name: '💵 Net Revenue (PHP)', value: `₱${netRevenue.toLocaleString()}`, inline: true },
          { name: '🥈 Basic Grants', value: grantCounts.basic.toLocaleString(), inline: true },
          { name: '🥇 Standard Grants', value: grantCounts.standard.toLocaleString(), inline: true },
          { name: '👑 Gold Grants', value: grantCounts.gold.toLocaleString(), inline: true },
          { name: '💠 Enterprise Grants', value: grantCounts.enterprise.toLocaleString(), inline: true },
          { name: '📦 Active Packs', value: packs.length.toLocaleString(), inline: true },
          { name: '📦 Pack Revenue (PHP)', value: `₱${packRevenue.toLocaleString()}`, inline: true },
          { name: '↩️ Basic Refunds', value: refundCounts.basic.toLocaleString(), inline: true },
          { name: '↩️ Standard Refunds', value: refundCounts.standard.toLocaleString(), inline: true },
          { name: '↩️ Gold/Ent Refunds', value: (refundCounts.gold + refundCounts.enterprise).toLocaleString(), inline: true },
        )
        .setDescription('*Revenue derived from Premium grant/refund history entries in the database.*')
        .setTimestamp()
        .setFooter({ text: 'Panindigan Official • Revenue Analytics' });

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
