import 'dotenv/config';
import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import fs2 from 'fs';
import path3 from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import winston from 'winston';
import 'winston-daily-rotate-file';

// src/deploy-commands.ts
var configPath = path3.resolve(process.cwd(), "config.json");
function resolveEnvRefs(value) {
  if (typeof value === "string" && value.startsWith("env:")) {
    const key = value.slice(4);
    return process.env[key] ?? void 0;
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveEnvRefs(v));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = resolveEnvRefs(v);
    }
    return out;
  }
  return value;
}
function readConfigFromDisk() {
  const raw = JSON.parse(fs2.readFileSync(configPath, "utf-8"));
  return resolveEnvRefs(raw);
}
readConfigFromDisk();
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". Set it in Replit Secrets (or .env locally) before starting the bot.`
    );
  }
  return value;
}
var LOG_DIR = path3.resolve(process.cwd(), "logs");
if (!fs2.existsSync(LOG_DIR)) fs2.mkdirSync(LOG_DIR, { recursive: true });
var c = {
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  white: "\x1B[97m",
  gray: "\x1B[90m",
  cyan: "\x1B[96m",
  cyanDim: "\x1B[36m",
  green: "\x1B[92m",
  yellow: "\x1B[93m",
  red: "\x1B[91m",
  magenta: "\x1B[95m",
  blue: "\x1B[94m"};
var CATEGORY_COLORS = {
  CMD: c.cyan,
  ERR: c.red,
  WARN: c.yellow,
  DB: c.green,
  API: c.magenta,
  PERF: c.blue,
  START: `${c.bold}${c.white}`,
  EVENT: c.gray,
  INTERACTION: c.cyanDim,
  SECURITY: `${c.bold}${c.red}`
};
var LEVEL_CONFIG = {
  error: { icon: "\u2716", label: "ERROR", color: c.red },
  warn: { icon: "\u26A0", label: "WARN ", color: c.yellow },
  info: { icon: "\u25CF", label: "INFO ", color: c.cyan },
  debug: { icon: "\u25CC", label: "DEBUG", color: c.gray }
};
var consoleFormat = winston.format.printf(({ level, message, timestamp, scope, category, ...meta }) => {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG["info"];
  const ts = `${c.dim}${c.gray}${timestamp}${c.reset}`;
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
      const v = meta[k];
      if (k === "stack" && typeof v === "string") return null;
      if (k === "error" && typeof v === "string") return `${c.red}${v}${c.reset}`;
      return `${c.dim}${k}${c.reset}=${c.cyan}${JSON.stringify(v)}${c.reset}`;
    }).filter(Boolean);
    if (parts.length) metaStr = `  ${c.gray}\u203A${c.reset} ${parts.join("  ")}`;
  }
  const stackStr = meta["stack"] && typeof meta["stack"] === "string" ? `
${c.dim}${meta["stack"].split("\n").slice(1).map((l) => `    ${l.trim()}`).join("\n")}${c.reset}` : "";
  return `${ts}  ${lvl}  ${tag} ${c.white}${message}${c.reset}${metaStr}${stackStr}`;
});
var fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);
var DailyRotateFile = winston.transports["DailyRotateFile"];
var rotateTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: "panindigan-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
  format: fileFormat
});
var errorRotateTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: "panindigan-error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
  format: fileFormat
});
var logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] ?? "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        consoleFormat
      )
    }),
    rotateTransport,
    errorRotateTransport
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        consoleFormat
      )
    }),
    errorRotateTransport
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "HH:mm:ss" }),
        consoleFormat
      )
    }),
    errorRotateTransport
  ]
});
function scopedLogger(scope) {
  return {
    info: (message, meta) => logger.info(message, { scope, ...meta }),
    warn: (message, meta) => logger.warn(message, { scope, ...meta }),
    error: (message, meta) => logger.error(message, { scope, ...meta }),
    debug: (message, meta) => logger.debug(message, { scope, ...meta })
  };
}

// src/deploy-commands.ts
var __filename$1 = fileURLToPath(import.meta.url);
var __dirname$1 = path3.dirname(__filename$1);
var _require = createRequire(import.meta.url);
var log = scopedLogger("deploy");
function sanitize(obj) {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name" && typeof v === "string") {
        out[k] = v.slice(0, 32);
        continue;
      }
      if (k === "description" && typeof v === "string") {
        out[k] = v.slice(0, 100);
        continue;
      }
      out[k] = sanitize(v);
    }
    return out;
  }
  return obj;
}
function walk(dir) {
  const entries = fs2.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path3.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}
async function main() {
  const commandsDir = path3.join(__dirname$1, "commands");
  const files = walk(commandsDir);
  const body = [];
  const seen = /* @__PURE__ */ new Set();
  for (const file of files) {
    try {
      const mod = _require(file);
      const command = mod.default ?? mod.command;
      if (!command?.name || typeof command.execute !== "function") continue;
      if (seen.has(command.name)) continue;
      seen.add(command.name);
      let builder = new SlashCommandBuilder().setName(command.name.slice(0, 32)).setDescription((command.description ?? "No description").slice(0, 100));
      if (command.slashData) {
        try {
          builder = command.slashData(builder);
        } catch {
        }
      }
      body.push(sanitize(builder.toJSON()));
      if (body.length >= 100) break;
    } catch (err) {
      log.warn(`Skipping command file (load error): ${path3.basename(file)}`, { error: err.message });
    }
  }
  const token = requireEnv("DISCORD_TOKEN");
  const clientId = requireEnv("DISCORD_CLIENT_ID");
  const rest = new REST({ version: "10" }).setToken(token);
  log.info(`Registering ${body.length} global slash commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body });
  log.info(`\u2705 Successfully registered ${body.length} slash commands globally. They may take up to 1 hour to propagate.`);
}
main().catch((err) => {
  log.error("Failed to deploy slash commands", { error: err.message, stack: err.stack });
  process.exit(1);
});
//# sourceMappingURL=deploy-commands.js.map
//# sourceMappingURL=deploy-commands.js.map