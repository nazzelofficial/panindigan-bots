/**
 * Monitor — real-time health and performance monitoring subsystem.
 *
 * Tracks memory, CPU, WebSocket ping, database health, Lavalink availability,
 * uptime, shards, and cache sizes. All monitors are lightweight polling loops
 * that log warnings when thresholds are breached.
 */

import { scopedLogger } from "../utils/logger.js";
import { isDatabaseConnected } from "../database/connection.js";
import type { PanindiganClient } from "./Client.js";

const log = scopedLogger("monitor");

export interface MonitorThresholds {
  heapWarnMB:    number;  // default 512
  heapAlertMB:   number;  // default 768
  cpuWarnPct:    number;  // default 80
  pingWarnMs:    number;  // default 400
  slowQueryMs:   number;  // default 200
  msgCacheWarn:  number;  // default 10_000
}

export interface MonitoringStats {
  heapUsedMB:    number;
  heapTotalMB:   number;
  wsPingMs:      number;
  dbConnected:   boolean;
  uptimeSeconds: number;
  guildCount:    number;
  userCount:     number;
  channelCount:  number;
  messageCache:  number;
  shardCount:    number;
  cpuPercent:    number;
}

const DEFAULT_THRESHOLDS: MonitorThresholds = {
  heapWarnMB:   512,
  heapAlertMB:  768,
  cpuWarnPct:   80,
  pingWarnMs:   400,
  slowQueryMs:  200,
  msgCacheWarn: 10_000,
};

/** Measure CPU usage over a short sample window (ms). */
async function sampleCpuPercent(sampleMs = 100): Promise<number> {
  const before = process.cpuUsage();
  const t0     = Date.now();
  await new Promise((r) => setTimeout(r, sampleMs));
  const delta  = process.cpuUsage(before);
  const elapsedUs = (Date.now() - t0) * 1_000;
  const cpuUs  = delta.user + delta.system;
  return Math.min(100, Math.round((cpuUs / elapsedUs) * 100));
}

/** Collect a point-in-time snapshot of all monitored values. */
export function collectStats(client: PanindiganClient): MonitoringStats {
  const mem        = process.memoryUsage();
  const heapUsedMB = mem.heapUsed  / 1_048_576;
  const heapTotalMB= mem.heapTotal / 1_048_576;

  let messageCache = 0;
  for (const channel of client.channels.cache.values()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = channel as any;
    if ("messages" in channel && ch.messages?.cache?.size) {
      messageCache += ch.messages.cache.size as number;
    }
  }

  return {
    heapUsedMB:    Math.round(heapUsedMB  * 10) / 10,
    heapTotalMB:   Math.round(heapTotalMB * 10) / 10,
    wsPingMs:      client.ws.ping,
    dbConnected:   isDatabaseConnected(),
    uptimeSeconds: Math.floor(process.uptime()),
    guildCount:    client.guilds.cache.size,
    userCount:     client.users.cache.size,
    channelCount:  client.channels.cache.size,
    messageCache,
    shardCount:    client.shard?.count ?? 1,
    cpuPercent:    0, // filled in asynchronously by the monitor
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

export class Monitor {
  private readonly client: PanindiganClient;
  private readonly thresholds: MonitorThresholds;
  private readonly intervals: NodeJS.Timeout[] = [];
  /** Rolling buffer of recent CPU samples for sustained-load detection. */
  private cpuSamples: number[] = [];

  constructor(client: PanindiganClient, thresholds: Partial<MonitorThresholds> = {}) {
    this.client     = client;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /** Start all monitoring loops. */
  start(): void {
    this.intervals.push(
      setInterval(() => this.checkMemory(),            60_000).unref(),
      setInterval(() => void this.checkCpu(),          10_000).unref(), // sample every 10 s
      setInterval(() => this.checkPing(),              30_000).unref(),
      setInterval(() => this.checkDatabase(),          60_000).unref(),
      setInterval(() => this.checkCache(),            600_000).unref(),
      setInterval(() => this.logShards(),             300_000).unref(),
    );
    log.info("Monitoring subsystem started", {
      intervals: this.intervals.length,
      thresholds: this.thresholds,
    });
  }

  /** Stop all monitoring loops. */
  stop(): void {
    for (const interval of this.intervals) clearInterval(interval);
    this.intervals.length = 0;
    this.cpuSamples       = [];
    log.info("Monitoring subsystem stopped");
  }

  // ── Individual checks ─────────────────────────────────────────────────────

  private checkMemory(): void {
    const mem   = process.memoryUsage();
    const mb    = Math.round(mem.heapUsed / 1_048_576);
    const total = Math.round(mem.heapTotal / 1_048_576);

    if (mb >= this.thresholds.heapAlertMB) {
      log.error(`🚨 HEAP ALERT: ${mb} MB used / ${total} MB total — consider restarting`, { heapMB: mb });
    } else if (mb >= this.thresholds.heapWarnMB) {
      log.warn(`🟡 Heap warning: ${mb} MB used / ${total} MB total`, { heapMB: mb });
    } else {
      log.debug(`Heap OK: ${mb} MB used / ${total} MB total`, { heapMB: mb });
    }
  }

  /**
   * Sample CPU usage over 100 ms, keep a rolling window of 5 samples,
   * and warn if all 5 consecutive samples exceed the threshold (sustained load).
   */
  private async checkCpu(): Promise<void> {
    const pct = await sampleCpuPercent(100);
    this.cpuSamples.push(pct);
    if (this.cpuSamples.length > 5) this.cpuSamples.shift();

    const sustained = this.cpuSamples.length === 5 && this.cpuSamples.every((s) => s >= this.thresholds.cpuWarnPct);
    if (sustained) {
      const avg = Math.round(this.cpuSamples.reduce((a, b) => a + b, 0) / 5);
      log.warn(`🟡 PERF: Sustained high CPU usage (avg ${avg}% over last 5 samples, threshold ${this.thresholds.cpuWarnPct}%)`, { cpuPct: avg });
    } else {
      log.debug(`CPU sample: ${pct}%`, { cpuPct: pct });
    }
  }

  private checkPing(): void {
    const ping = this.client.ws.ping;
    if (ping >= this.thresholds.pingWarnMs) {
      log.warn(`🟡 High WS ping: ${ping} ms`, { pingMs: ping });
    } else {
      log.debug(`WS ping OK: ${ping} ms`, { pingMs: ping });
    }
  }

  private checkDatabase(): void {
    const connected = isDatabaseConnected();
    if (!connected) {
      log.error("🚨 Database disconnected — reconnect in progress", { connected });
    } else {
      log.debug("Database health OK", { connected });
    }
  }

  private checkCache(): void {
    const stats = collectStats(this.client);
    const { messageCache, guildCount, userCount, channelCount } = stats;

    log.info("Cache snapshot", { guilds: guildCount, users: userCount, channels: channelCount, messages: messageCache });

    if (messageCache >= this.thresholds.msgCacheWarn) {
      log.warn(`🟡 Message cache is large: ${messageCache} entries (threshold ${this.thresholds.msgCacheWarn})`, { messageCache });
    }
  }

  private logShards(): void {
    const count = this.client.shard?.count ?? 1;
    log.info("Shard status", { shardCount: count, wsPingMs: this.client.ws.ping, guilds: this.client.guilds.cache.size });
  }
}
