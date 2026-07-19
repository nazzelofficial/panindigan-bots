import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import "winston-daily-rotate-file";

const LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── ANSI colour helpers ─────────────────────────────────────────────────────
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
  bgBlue:    "\x1b[44m",
  bgRed:     "\x1b[41m",
  bgYellow:  "\x1b[43m",
  bgGreen:   "\x1b[42m",
  bgMagenta: "\x1b[45m",
};

// ─── Category label → color mapping ─────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  CMD:         c.cyan,
  ERR:         c.red,
  WARN:        c.yellow,
  DB:          c.green,
  API:         c.magenta,
  PERF:        c.blue,
  START:       `${c.bold}${c.white}`,
  EVENT:       c.gray,
  INTERACTION: c.cyanDim,
  SECURITY:    `${c.bold}${c.red}`,
};

const LEVEL_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  error: { icon: "✖", label: "ERROR", color: c.red    },
  warn:  { icon: "⚠", label: "WARN ", color: c.yellow },
  info:  { icon: "●", label: "INFO ", color: c.cyan   },
  debug: { icon: "◌", label: "DEBUG", color: c.gray   },
};

// ─── Console format ──────────────────────────────────────────────────────────
const consoleFormat = winston.format.printf(({ level, message, timestamp, scope, category, ...meta }) => {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG["info"]!;
  const ts  = `${c.dim}${c.gray}${timestamp}${c.reset}`;
  const lvl = `${c.bold}${cfg.color}${cfg.icon} ${cfg.label}${c.reset}`;

  // Show scope OR category label (category takes precedence if both set)
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

// ─── File (JSON) format ──────────────────────────────────────────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// ─── Transports ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DailyRotateFile = (winston.transports as any)["DailyRotateFile"] as new (opts: unknown) => winston.transport;

const rotateTransport      = new DailyRotateFile({
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

// ─── Startup banner ──────────────────────────────────────────────────────────
export function printBanner(version: string): void {
  const line = "─".repeat(54);
  process.stdout.write(
    `\n${c.bold}${c.blue}╭${line}╮${c.reset}\n` +
    `${c.bold}${c.blue}│${c.reset}${c.bold}${c.white}  🇵🇭  Panindigan Official  v${version.padEnd(26)}${c.reset}${c.bold}${c.blue}│${c.reset}\n` +
    `${c.bold}${c.blue}│${c.reset}${c.dim}${c.gray}     Enterprise-grade Discord Bot for PH communities  ${c.reset}${c.bold}${c.blue}│${c.reset}\n` +
    `${c.bold}${c.blue}╰${line}╯${c.reset}\n\n`,
  );
}

// ─── Scoped logger (generic) ─────────────────────────────────────────────────
export function scopedLogger(scope: string) {
  return {
    info:  (message: string, meta?: Record<string, unknown>) => logger.info(message,  { scope, ...meta }),
    warn:  (message: string, meta?: Record<string, unknown>) => logger.warn(message,  { scope, ...meta }),
    error: (message: string, meta?: Record<string, unknown>) => logger.error(message, { scope, ...meta }),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, { scope, ...meta }),
  };
}

// ─── Category loggers ────────────────────────────────────────────────────────
/** [CMD] cyan — command execution events */
export const cmdLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "CMD",  ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "CMD",  ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "CMD",  ...meta }),
};

/** [DB] green — database events */
export const dbLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "DB",   ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "DB",   ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "DB",   ...meta }),
};

/** [API] magenta — external API calls (OpenAI, Lavalink, weather) */
export const apiLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "API",  ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "API",  ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "API",  ...meta }),
};

/** [PERF] blue — slow-operation warnings */
export const perfLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "PERF", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "PERF", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "PERF", ...meta }),
};

/** [START] white bold — startup/shutdown lifecycle */
export const startLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "START", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "START", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "START", ...meta }),
};

/** [EVENT] gray — Discord gateway events */
export const eventLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "EVENT", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "EVENT", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "EVENT", ...meta }),
};

/** [INTERACTION] cyan dim — button/select/modal interactions */
export const interactionLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "INTERACTION", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "INTERACTION", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "INTERACTION", ...meta }),
};

/** [SECURITY] red bold — permission denials, rate limits, sanitization rejections */
export const securityLog = {
  info:  (msg: string, meta?: Record<string, unknown>) => logger.info(msg,  { category: "SECURITY", ...meta }),
  warn:  (msg: string, meta?: Record<string, unknown>) => logger.warn(msg,  { category: "SECURITY", ...meta }),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, { category: "SECURITY", ...meta }),
};
