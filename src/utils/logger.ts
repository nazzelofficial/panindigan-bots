/**
 * logger.ts v0.2.6 — Enterprise-grade structured logging system.
 *
 * Log categories (v0.2.6 spec):
 *   COMMAND    🟣  Magenta  — command execution events
 *   EVENT      🔵  Cyan     — Discord gateway events
 *   DATABASE   🟢  Green    — query latency, pool, errors
 *   VOICE      🟡  Yellow   — Lavalink, voice sessions
 *   ERROR      🔴  Red      — application errors
 *   SECURITY   🟠  Orange   — permission denials, rate limits
 *   PERF       ⚪  White    — slow-operation diagnostics
 *   SYSTEM     ⚫  Gray     — startup/shutdown lifecycle
 *   API        🟣  Magenta  — external API calls
 *   INTERACTION     Cyan dim — button/select/modal events
 */

import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import "winston-daily-rotate-file";

const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── ANSI colour helpers ──────────────────────────────────────────────────────
const c = {
  reset:     "\x1b[0m",
  bold:      "\x1b[1m",
  dim:       "\x1b[2m",
  white:     "\x1b[97m",
  gray:      "\x1b[90m",
  cyan:      "\x1b[96m",
  cyanDim:   "\x1b[36m",
  green:     "\x1b[92m",
  yellow:    "\x1b[93m",
  red:       "\x1b[91m",
  magenta:   "\x1b[95m",
  blue:      "\x1b[94m",
  orange:    "\x1b[33m",
  bgBlue:    "\x1b[44m",
  bgRed:     "\x1b[41m",
  bgYellow:  "\x1b[43m",
  bgGreen:   "\x1b[42m",
  bgMagenta: "\x1b[45m",
};

// ─── Category label → color mapping (v0.2.6 spec) ───────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  COMMAND:     c.magenta,
  CMD:         c.magenta,
  EVENT:       c.cyan,
  DATABASE:    c.green,
  DB:          c.green,
  VOICE:       c.yellow,
  ERROR:       c.red,
  ERR:         c.red,
  SECURITY:    `${c.bold}${c.orange}`,
  PERF:        c.white,
  PERFORMANCE: c.white,
  SYSTEM:      c.gray,
  START:       `${c.bold}${c.white}`,
  API:         c.magenta,
  INTERACTION: c.cyanDim,
};

const LEVEL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  error: { icon: "✖", label: "ERROR", color: c.red    },
  warn:  { icon: "⚠", label: "WARN ", color: c.yellow },
  info:  { icon: "●", label: "INFO ", color: c.cyan   },
  debug: { icon: "◌", label: "DEBUG", color: c.gray   },
};

// ─── Console format ───────────────────────────────────────────────────────────
const consoleFormat = winston.format.printf(({ level, message, timestamp, scope, category, ...meta }) => {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG["info"]!;
  const ts  = `${c.dim}${c.gray}${timestamp}${c.reset}`;
  const lvl = `${c.bold}${cfg.color}${cfg.icon} ${cfg.label}${c.reset}`;

  let tag = "";
  if (category && typeof category === "string") {
    const col = CATEGORY_COLORS[category.toUpperCase()] ?? c.blue;
    tag = `${c.bold}${col}[${category.toUpperCase()}]${c.reset}`;
  } else if (scope) {
    tag = `${c.bold}${c.blue}[${String(scope).toUpperCase()}]${c.reset}`;
  }

  const metaKeys = Object.keys(meta);
  let metaStr = "";
  if (metaKeys.length) {
    const parts = metaKeys.map((k) => {
      const v = (meta as Record<string, unknown>)[k];
      if (k === "stack" && typeof v === "string") return null;
      if (k === "error" && typeof v === "string") return `${c.red}${v}${c.reset}`;
      return `${c.dim}${k}${c.reset}=${c.cyan}${JSON.stringify(v)}${c.reset}`;
    }).filter(Boolean);
    if (parts.length) metaStr = `  ${c.gray}›${c.reset} ${parts.join("  ")}`;
  }

  const stackStr = meta["stack"] && typeof meta["stack"] === "string"
    ? `\n${c.dim}${(meta["stack"] as string).split("\n").slice(1).map((l: string) => `    ${l.trim()}`).join("\n")}${c.reset}`
    : "";

  return `${ts}  ${lvl}  ${tag} ${c.white}${message}${c.reset}${metaStr}${stackStr}`;
});

// ─── File (structured JSON) format ───────────────────────────────────────────
// v0.2.6 spec log format:
// { timestamp, level, category, guild_id, user_id, shard_id, command,
//   execution_time_ms, db_latency_ms, api_latency_ms, voice_latency_ms,
//   memory_mb, cpu_percent }
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ─── Transports ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DailyRotateFile = (winston.transports as any)["DailyRotateFile"] as new (opts: unknown) => winston.transport;

const rotateTransport = new DailyRotateFile({
  dirname:       LOG_DIR,
  filename:      "panindigan-%DATE%.log",
  datePattern:   "YYYY-MM-DD",
  zippedArchive: true,
  maxSize:       "20m",
  maxFiles:      "14d",
  level:         "info",
  format:        fileFormat,
});

const errorRotateTransport = new DailyRotateFile({
  dirname:       LOG_DIR,
  filename:      "panindigan-error-%DATE%.log",
  datePattern:   "YYYY-MM-DD",
  zippedArchive: true,
  maxSize:       "20m",
  maxFiles:      "30d",
  level:         "error",
  format:        fileFormat,
});

export const logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] ?? "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        consoleFormat,
      ),
    }),
    rotateTransport,
    errorRotateTransport,
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        consoleFormat,
      ),
    }),
    errorRotateTransport,
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        consoleFormat,
      ),
    }),
    errorRotateTransport,
  ],
});

// ─── Startup banner ───────────────────────────────────────────────────────────
export function printBanner(version: string): void {
  const line = "─".repeat(54);
  process.stdout.write(
    `\n${c.bold}${c.magenta}╭${line}╮${c.reset}\n` +
    `${c.bold}${c.magenta}│${c.reset}${c.bold}${c.white}  🇵🇭  Panindigan Official  v${version.padEnd(26)}${c.reset}${c.bold}${c.magenta}│${c.reset}\n` +
    `${c.bold}${c.magenta}│${c.reset}${c.dim}${c.gray}     Enterprise-grade Discord Bot for PH communities  ${c.reset}${c.bold}${c.magenta}│${c.reset}\n` +
    `${c.bold}${c.magenta}╰${line}╯${c.reset}\n\n`,
  );
}

// ─── Scoped logger ────────────────────────────────────────────────────────────
export function scopedLogger(scope: string) {
  return {
    info:  (message: string, meta?: Record<string, unknown>) => logger.info(message,  { scope, ...meta }),
    warn:  (message: string, meta?: Record<string, unknown>) => logger.warn(message,  { scope, ...meta }),
    error: (message: string, meta?: Record<string, unknown>) => logger.error(message, { scope, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, { scope, ...meta }),
  };
}

// ─── Category loggers (v0.2.6) ────────────────────────────────────────────────

/** [COMMAND] magenta — command execution events */
export const cmdLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "COMMAND", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "COMMAND", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "COMMAND", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "COMMAND", ...meta }),
};

/** [DATABASE] green — database query events */
export const dbLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "DATABASE", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "DATABASE", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "DATABASE", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "DATABASE", ...meta }),
};

/** [EVENT] cyan — Discord gateway events */
export const eventLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "EVENT", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "EVENT", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "EVENT", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "EVENT", ...meta }),
};

/** [VOICE] yellow — Lavalink + voice session events */
export const voiceLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "VOICE", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "VOICE", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "VOICE", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "VOICE", ...meta }),
};

/** [API] magenta — external API calls (OpenAI, Lavalink, weather, etc.) */
export const apiLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "API", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "API", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "API", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "API", ...meta }),
};

/** [PERF] white — slow-operation warnings */
export const perfLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "PERF", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "PERF", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "PERF", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "PERF", ...meta }),
};

/** [SYSTEM] gray — startup/shutdown lifecycle */
export const startLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "SYSTEM", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "SYSTEM", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "SYSTEM", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "SYSTEM", ...meta }),
};

/** [INTERACTION] cyan dim — button/select/modal interactions */
export const interactionLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "INTERACTION", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "INTERACTION", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "INTERACTION", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "INTERACTION", ...meta }),
};

/** [SECURITY] orange bold — permission denials, rate limits, sanitization rejections */
export const securityLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "SECURITY", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "SECURITY", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "SECURITY", ...meta }),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, { category: "SECURITY", ...meta }),
};

// ─── Structured command telemetry log ─────────────────────────────────────────
/**
 * Log a fully-structured command execution entry per v0.2.6 log format spec.
 * Pass all available latency measurements for observability dashboards.
 */
export function logCommandExecution(opts: {
  guild_id?: string;
  user_id: string;
  shard_id?: number;
  command: string;
  execution_time_ms: number;
  db_latency_ms?: number;
  api_latency_ms?: number;
  voice_latency_ms?: number;
  memory_mb?: number;
  cpu_percent?: number;
  success: boolean;
  error?: string;
}): void {
  const mem = process.memoryUsage();
  const entry = {
    level:              opts.success ? "info" : "warn",
    category:           "COMMAND",
    guild_id:           opts.guild_id,
    user_id:            opts.user_id,
    shard_id:           opts.shard_id,
    command:            opts.command,
    execution_time_ms:  opts.execution_time_ms,
    db_latency_ms:      opts.db_latency_ms,
    api_latency_ms:     opts.api_latency_ms,
    voice_latency_ms:   opts.voice_latency_ms,
    memory_mb:          opts.memory_mb ?? Math.round(mem.heapUsed / 1_048_576),
    cpu_percent:        opts.cpu_percent,
    success:            opts.success,
    error:              opts.error,
  };

  if (opts.success) {
    logger.info(`/${opts.command} executed`, entry);
  } else {
    logger.warn(`/${opts.command} failed`, entry);
  }
}
