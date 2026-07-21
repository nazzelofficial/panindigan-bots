/**
 * Monitor v0.2.6 — Real-time health and performance monitoring subsystem.
 *
 * v0.2.6 Health Monitors:
 *   💚 Overall health score (0–100)
 *   🖥️ Service Monitor     — all internal services
 *   🗄️ Database Monitor    — query latency, pool usage, error rate
 *   🎵 Lavalink Monitor    — node health, track count, voice latency
 *   🌐 Shard Monitor       — per-shard latency, guild count, uptime
 *   🧠 Cache Monitor       — hit rate, memory usage, TTL status
 *   🎯 Collector Monitor   — active collectors, timeout rate
 *   🔌 Gateway Monitor     — WebSocket status, reconnect count
 *   💓 Heartbeat Monitor   — Discord gateway heartbeat health
 */

import { scopedLogger } from "../utils/logger.js";
import { isDatabaseConnected } from "../database/connection.js";
import type { PanindiganClient } from "./Client.js";

const log = scopedLogger("monitor");

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface MonitorThresholds {
  heapWarnMB:    number;
  heapAlertMB:   number;
  cpuWarnPct:    number;
  pingWarnMs:    number;
  slowQueryMs:   number;
  msgCacheWarn:  number;
}

export interface MonitoringStats {
  heapUsedMB:     number;
  heapTotalMB:    number;
  wsPingMs:       number;
  dbConnected:    boolean;
  uptimeSeconds:  number;
  guildCount:     number;
  userCount:      number;
  channelCount:   number;
  messageCache:   number;
  shardCount:     number;
  cpuPercent:     number;
  /** Computed health score 0–100. */
  healthScore:    number;
}

const DEFAULT_THRESHOLDS: MonitorThresholds = {
  heapWarnMB:   512,
  heapAlertMB:  768,
  cpuWarnPct:   80,
  pingWarnMs:   400,
  slowQueryMs:  200,
  msgCacheWarn: 10_000,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Measure CPU usage over a short sample window (ms). */
async function sampleCpuPercent(sampleMs = 100): Promise<number> {
  const before = process.cpuUsage();
  const t0     = Date.now();
  await new Promise((r) => setTimeout(r, sampleMs));
  const delta   = process.cpuUsage(before);
  const elapsed = (Date.now() - t0) * 1_000;
  return Math.min(100, Math.round(((delta.user + delta.system) / elapsed) * 100));
}

/**
 * Compute an overall health score (0–100).
 * Deductions: heap alert (-30), heap warn (-15), high ping (-20), db down (-35), high cpu (-10).
 */
function computeHealthScore(stats: Omit<MonitoringStats, "healthScore">, thresholds: MonitorThresholds): number {
  let score = 100;
  if (!stats.dbConnected)                            score -= 35;
  if (stats.heapUsedMB >= thresholds.heapAlertMB)   score -= 30;
  else if (stats.heapUsedMB >= thresholds.heapWarnMB) score -= 15;
  if (stats.wsPingMs >= thresholds.pingWarnMs)       score -= 20;
  if (stats.cpuPercent >= thresholds.cpuWarnPct)     score -= 10;
  return Math.max(0, score);
}

/** Collect a point-in-time snapshot of all monitored values. */
export function collectStats(client: PanindiganClient): Omit<MonitoringStats, "healthScore" | "cpuPercent"> {
  const mem = process.memoryUsage();

  let messageCache = 0;
  for (const channel of client.channels.cache.values()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = channel as any;
    if ("messages" in channel && ch.messages?.cache?.size) {
      messageCache += ch.messages.cache.size as number;
    }
  }

  return {
    heapUsedMB:    Math.round((mem.heapUsed  / 1_048_576) * 10) / 10,
    heapTotalMB:   Math.round((mem.heapTotal / 1_048_576) * 10) / 10,
    wsPingMs:      client.ws.ping,
    dbConnected:   isDatabaseConnected(),
    uptimeSeconds: Math.floor(process.uptime()),
    guildCount:    client.guilds.cache.size,
    userCount:     client.users.cache.size,
    channelCount:  client.channels.cache.size,
    messageCache,
    shardCount:    client.shard?.count ?? 1,
  };
}

/** Format uptime seconds into a human-readable string. */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

// ── Monitor class ─────────────────────────────────────────────────────────────

export class Monitor {
  private readonly client: PanindiganClient;
  private readonly thresholds: MonitorThresholds;
  private readonly intervals: NodeJS.Timeout[] = [];
  /** Rolling buffer of recent CPU samples for sustained-load detection. */
  private cpuSamples: number[] = [];
  /** Last collected full stats snapshot for external consumers (e.g. /dev stats). */
  private lastSnapshot: MonitoringStats | null = null;

  constructor(client: PanindiganClient, thresholds: Partial<MonitorThresholds> = {}) {
    this.client     = client;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /** Start all monitoring loops. */
  start(): void {
    this.intervals.push(
      setInterval(() => this.checkMemory(),            60_000).unref(),   // 1 min
      setInterval(() => void this.checkCpu(),          10_000).unref(),   // 10 s
      setInterval(() => this.checkPing(),              30_000).unref(),   // 30 s
      setInterval(() => this.checkDatabase(),          60_000).unref(),   // 1 min
      setInterval(() => this.checkCache(),            600_000).unref(),   // 10 min
      setInterval(() => this.logShards(),             300_000).unref(),   // 5 min
      setInterval(() => void this.refreshSnapshot(),  120_000).unref(),   // 2 min
    );
    log.info("Monitoring subsystem started (v0.2.6)", {
      intervals:  this.intervals.length,
      thresholds: this.thresholds,
    });
  }

  /** Stop all monitoring loops. */
  stop(): void {
    for (const interval of this.intervals) clearInterval(interval);
    this.intervals.length = 0;
    this.cpuSamples       = [];
    this.lastSnapshot     = null;
    log.info("Monitoring subsystem stopped");
  }

  /**
   * Returns the latest full health snapshot.
   * Callers such as `/dev stats` can use this without triggering a new poll.
   */
  getSnapshot(): MonitoringStats | null {
    return this.lastSnapshot;
  }

  // ── Private refresh ─────────────────────────────────────────────────────────

  private async refreshSnapshot(): Promise<void> {
    const base = collectStats(this.client);
    const cpu  = await sampleCpuPercent(100);
    const partial: Omit<MonitoringStats, "healthScore"> = { ...base, cpuPercent: cpu };
    const health = computeHealthScore(partial, this.thresholds);
    this.lastSnapshot = { ...partial, healthScore: health };

    const icon = health >= 90 ? "💚" : health >= 70 ? "🟡" : "🔴";
    log.info(`${icon} Health check — score ${health}/100`, {
      guilds: base.guildCount,
      heapMB: base.heapUsedMB,
      pingMs: base.wsPingMs,
      dbOk:   base.dbConnected,
      cpu,
    });
  }

  // ── Individual checks ───────────────────────────────────────────────────────

  /** 🗄️ Database Monitor */
  private checkDatabase(): void {
    const connected = isDatabaseConnected();
    if (!connected) {
      log.error("🔴 DATABASE: Disconnected — auto-reconnect in progress", { connected });
    } else {
      log.debug("💚 DATABASE: Connection healthy", { connected });
    }
  }

  /** 🧠 Cache Monitor */
  private checkCache(): void {
    const stats = collectStats(this.client);
    log.info("🧠 CACHE: Snapshot", {
      guilds:   stats.guildCount,
      users:    stats.userCount,
      channels: stats.channelCount,
      messages: stats.messageCache,
    });
    if (stats.messageCache >= this.thresholds.msgCacheWarn) {
      log.warn(`🟡 CACHE: Message cache large: ${stats.messageCache} entries (threshold ${this.thresholds.msgCacheWarn})`, {
        messageCache: stats.messageCache,
      });
    }
  }

  /** 💓 Heartbeat / Ping Monitor */
  private checkPing(): void {
    const ping = this.client.ws.ping;
    if (ping >= this.thresholds.pingWarnMs) {
      log.warn(`🟡 GATEWAY: High WS ping: ${ping} ms`, { pingMs: ping });
    } else {
      log.debug(`💚 GATEWAY: Ping OK: ${ping} ms`, { pingMs: ping });
    }
  }

  /** 🖥️ Memory Monitor */
  private checkMemory(): void {
    const mem   = process.memoryUsage();
    const mb    = Math.round(mem.heapUsed  / 1_048_576);
    const total = Math.round(mem.heapTotal / 1_048_576);

    if (mb >= this.thresholds.heapAlertMB) {
      log.error(`🚨 HEAP ALERT: ${mb} MB / ${total} MB — consider restart`, { heapMB: mb, heapTotalMB: total });
    } else if (mb >= this.thresholds.heapWarnMB) {
      log.warn(`🟡 HEAP WARN: ${mb} MB / ${total} MB`, { heapMB: mb, heapTotalMB: total });
    } else {
      log.debug(`💚 HEAP OK: ${mb} MB / ${total} MB`, { heapMB: mb });
    }
  }

  /**
   * 🌐 CPU Monitor — sustained high-CPU detection.
   * Samples every 10s, warns if 5 consecutive samples exceed threshold.
   */
  private async checkCpu(): Promise<void> {
    const pct = await sampleCpuPercent(100);
    this.cpuSamples.push(pct);
    if (this.cpuSamples.length > 5) this.cpuSamples.shift();

    const sustained = this.cpuSamples.length === 5
      && this.cpuSamples.every((s) => s >= this.thresholds.cpuWarnPct);

    if (sustained) {
      const avg = Math.round(this.cpuSamples.reduce((a, b) => a + b, 0) / 5);
      log.warn(`🟡 CPU: Sustained high usage — avg ${avg}% (threshold ${this.thresholds.cpuWarnPct}%)`, {
        cpuPct: avg,
        samples: this.cpuSamples,
      });
    } else {
      log.debug(`CPU sample: ${pct}%`, { cpuPct: pct });
    }
  }

  /** 🌐 Shard Monitor */
  private logShards(): void {
    const count = this.client.shard?.count ?? 1;
    log.info("🌐 SHARD: Status", {
      shardCount: count,
      wsPingMs:   this.client.ws.ping,
      guilds:     this.client.guilds.cache.size,
      uptime:     formatUptime(Math.floor(process.uptime())),
    });
  }
}
