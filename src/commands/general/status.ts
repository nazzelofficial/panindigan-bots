/**
 * status command v0.2.6
 * Live system health status embed with all service indicators.
 *
 * Shows:
 *   🔌 Discord Gateway  — WS ping + connection state
 *   🗄️ Database         — connectivity + response time
 *   🎵 Lavalink Node    — music server status + player count
 *   🤖 AI Provider      — OpenAI availability
 *   💾 Memory           — heap usage
 *   🖥️ CPU              — current usage
 *   ⏰ Uptime           — process uptime
 *   ✅/⚠️/❌ overall health score
 */

import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { isDatabaseConnected } from "../../database/connection.js";
import { formatUptime } from "../../structures/Monitor.js";
import { BOT_VERSION } from "../../constants/index.js";

function getHealthIcon(ok: boolean, degraded = false): string {
  if (ok && !degraded) return "✅ Operational";
  if (degraded)        return "⚠️ Degraded";
  return "❌ Offline";
}

function getOverallColor(score: number): "success" | "warning" | "danger" {
  if (score >= 90) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

const command: CommandDefinition = {
  name:        "status",
  description: "Tingnan ang live system status ng bot — lahat ng services at health metrics",
  category:    "General",
  access:      "general",
  guildOnly:   false,
  cooldown:    10,
  aliases:     ["health", "ping-all"],
  slashData:   (b) => b as SlashCommandBuilder,

  async execute(ctx) {
    // Show loading state immediately
    await ctx.reply({
      embeds: [EmbedFactory.staged("fetching").setTitle("🔄 Kinukuha ang status data…")],
    });

    const startTime = Date.now();

    // ── Collect all metrics ───────────────────────────────────────────────────
    const mem         = process.memoryUsage();
    const heapMB      = Math.round(mem.heapUsed  / 1_048_576);
    const heapTotalMB = Math.round(mem.heapTotal / 1_048_576);
    const heapPct     = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    const uptime      = formatUptime(Math.floor(process.uptime()));
    const wsPing      = ctx.client.ws.ping;
    const dbOk        = isDatabaseConnected();
    const shardId     = ctx.client.shard?.ids?.[0];

    // ── CPU sample ────────────────────────────────────────────────────────────
    const cpuBefore  = process.cpuUsage();
    const t0         = Date.now();
    await new Promise((r) => setTimeout(r, 50));
    const cpuDelta   = process.cpuUsage(cpuBefore);
    const elapsed    = (Date.now() - t0) * 1_000;
    const cpuPct     = Math.min(100, Math.round(((cpuDelta.user + cpuDelta.system) / elapsed) * 100));

    // ── Lavalink status ───────────────────────────────────────────────────────
    const lava       = ctx.client.lavalink;
    const lavalinkOk = lava != null && lava.nodeManager.nodes.size > 0
      && [...lava.nodeManager.nodes.values()].some((n: any) => n.connected ?? n.options?.connected);
    const playerCount = lava
      ? [...(lava.nodeManager?.nodes?.values() ?? [])].reduce((acc: number, n: any) => acc + (n.stats?.playingPlayers ?? 0), 0)
      : 0;

    // ── AI provider availability ──────────────────────────────────────────────
    const aiKey      = process.env["OPENAI_API_KEY"];
    const aiOk       = !!(aiKey && aiKey.length > 10);

    // ── Health score ──────────────────────────────────────────────────────────
    let healthScore = 100;
    if (!dbOk)         healthScore -= 35;
    if (!lavalinkOk)   healthScore -= 15;
    if (!aiOk)         healthScore -= 10;
    if (heapPct > 90)  healthScore -= 25;
    else if (heapPct > 75) healthScore -= 10;
    if (wsPing > 400)  healthScore -= 15;
    if (cpuPct > 80)   healthScore -= 10;
    healthScore = Math.max(0, healthScore);

    const scoreIcon = healthScore >= 90 ? "💚" : healthScore >= 70 ? "🟡" : "🔴";
    const color     = getOverallColor(healthScore);

    // ── Build embed ───────────────────────────────────────────────────────────
    const embed = EmbedFactory[color](
      `**Health Score: ${scoreIcon} ${healthScore}/100**`,
      "🔴 Panindigan System Status",
    );

    embed
      .setTitle("🔴 Panindigan System Status")
      .setDescription(
        `**${scoreIcon} Health Score: ${healthScore}/100**\n` +
        (healthScore >= 90
          ? "Lahat ng systems ay operational. ✅"
          : healthScore >= 70
          ? "May ilang systems na degraded. ⚠️"
          : "May kritikal na sistema na offline. ❌"),
      );

    // Services status
    embed.addFields(
      {
        name:   "🔌 Discord Gateway",
        value:  `${getHealthIcon(wsPing < 400)}\nPing: \`${wsPing}ms\`${shardId !== undefined ? ` · Shard ${shardId}` : ""}`,
        inline: true,
      },
      {
        name:   "🗄️ Database",
        value:  `${getHealthIcon(dbOk)}\n${dbOk ? "MongoDB Atlas" : "Reconnecting…"}`,
        inline: true,
      },
      {
        name:   "🎵 Lavalink (Music)",
        value:  `${getHealthIcon(lavalinkOk)}\n${lavalinkOk ? `${playerCount} player${playerCount !== 1 ? "s" : ""} active` : "Hindi configured o offline"}`,
        inline: true,
      },
      {
        name:   "🤖 AI Provider",
        value:  `${getHealthIcon(aiOk)}\n${aiOk ? "OpenAI · Ready" : "API key hindi configured"}`,
        inline: true,
      },
      {
        name:   "💾 Memory",
        value:  `${heapMB >= 700 ? "⚠️ High" : "✅ OK"}\n\`${heapMB}MB\` / \`${heapTotalMB}MB\` (${heapPct}%)`,
        inline: true,
      },
      {
        name:   "🖥️ CPU",
        value:  `${cpuPct >= 80 ? "⚠️ High" : "✅ OK"}\n\`${cpuPct}%\` usage`,
        inline: true,
      },
    );

    // System info
    embed.addFields(
      {
        name:   "⏰ Uptime",
        value:  `\`${uptime}\``,
        inline: true,
      },
      {
        name:   "🏠 Servers",
        value:  `\`${ctx.client.guilds.cache.size}\``,
        inline: true,
      },
      {
        name:   "📦 Commands",
        value:  `\`${ctx.client.commands.size}\` loaded`,
        inline: true,
      },
    );

    // Response time
    const responseTime = Date.now() - startTime;
    embed.setFooter({
      text:    `🤖 Panindigan Official · v${BOT_VERSION} · Response: ${responseTime}ms`,
      iconURL: "https://cdn.discordapp.com/embed/avatars/0.png",
    });
    embed.setTimestamp();

    // Reply with final embed
    try {
      if (ctx.isSlash && ctx.interaction!.deferred) {
        await ctx.interaction!.editReply({ embeds: [embed] });
      } else {
        await ctx.reply({ embeds: [embed] });
      }
    } catch {
      await ctx.reply({ embeds: [embed] });
    }
  },
};

export default command;
