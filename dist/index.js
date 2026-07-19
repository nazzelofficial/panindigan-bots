import 'dotenv/config';
import { Client, Collection, Partials, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fs2 from 'fs';
import path3 from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import mongoose7, { Schema, model } from 'mongoose';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { LavalinkManager } from 'lavalink-client';
import express from 'express';
import cron from 'node-cron';

// src/index.ts
var CONFIG_TTL_MS = 6e4;
var configPath = path3.resolve(process.cwd(), "config.json");
var _configCache = null;
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
function getConfig() {
  const now = Date.now();
  if (!_configCache || now > _configCache.expiresAt) {
    _configCache = { value: readConfigFromDisk(), expiresAt: now + CONFIG_TTL_MS };
  }
  return _configCache.value;
}
var config = readConfigFromDisk();
var ENV_SCHEMA = [
  { key: "DISCORD_TOKEN", required: true, description: "Discord bot token" },
  { key: "DISCORD_CLIENT_ID", required: true, description: "Discord application/client ID" },
  { key: "MONGODB_URI", required: true, description: "MongoDB Atlas connection string" },
  { key: "BOT_OWNER_IDS", required: true, description: "Comma-separated Discord user IDs treated as bot owners" },
  { key: "LAVALINK_HOST", required: false, description: "Lavalink node host (music)" },
  { key: "LAVALINK_PORT", required: false, description: "Lavalink node port (music)" },
  { key: "LAVALINK_PASSWORD", required: false, description: "Lavalink node password (music)" },
  { key: "OPENAI_API_KEY", required: false, description: "OpenAI API key (AI features)" },
  { key: "API_PORT", required: false, description: "Port for the REST API / dashboard backend" },
  { key: "API_JWT_SECRET", required: false, description: "Secret used to sign REST API JWTs" },
  { key: "SESSION_SECRET", required: false, description: "Session secret for the REST API" }
];
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${key}". Set it in Replit Secrets (or .env locally) before starting the bot.`
    );
  }
  return value;
}
function validateEnv() {
  const missing = [];
  const optionalMissing = [];
  for (const entry of ENV_SCHEMA) {
    if (!process.env[entry.key]) {
      if (entry.required) missing.push(entry);
      else optionalMissing.push(entry);
    }
  }
  return { missing, optionalMissing };
}
function isFeatureEnabled(feature) {
  const cfg = getConfig();
  const features = cfg["features"];
  if (!features) return true;
  return features[feature] !== false;
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
function printBanner(version) {
  const line = "\u2500".repeat(54);
  process.stdout.write(
    `
${c.bold}${c.blue}\u256D${line}\u256E${c.reset}
${c.bold}${c.blue}\u2502${c.reset}${c.bold}${c.white}  \u{1F1F5}\u{1F1ED}  Panindigan Official  v${version.padEnd(26)}${c.reset}${c.bold}${c.blue}\u2502${c.reset}
${c.bold}${c.blue}\u2502${c.reset}${c.dim}${c.gray}     Enterprise-grade Discord Bot for PH communities  ${c.reset}${c.bold}${c.blue}\u2502${c.reset}
${c.bold}${c.blue}\u2570${line}\u256F${c.reset}

`
  );
}
function scopedLogger(scope) {
  return {
    info: (message, meta) => logger.info(message, { scope, ...meta }),
    warn: (message, meta) => logger.warn(message, { scope, ...meta }),
    error: (message, meta) => logger.error(message, { scope, ...meta }),
    debug: (message, meta) => logger.debug(message, { scope, ...meta })
  };
}

// src/structures/Client.ts
var log = scopedLogger("client");
var PanindiganClient = class extends Client {
  commands = new Collection();
  aliases = new Collection();
  cooldowns = new Collection();
  events = new Collection();
  lavalink = null;
  config = config;
  startedAt = Date.now();
  /** customId prefix (before the first ":") -> handler, for buttons/selects/modals. */
  componentHandlers = new Collection();
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildEmojisAndStickers
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
      allowedMentions: { parse: ["users", "roles"], repliedUser: true }
    });
  }
  isOnCooldown(commandName, userId, seconds) {
    if (!seconds) return null;
    const bucket = this.cooldowns.get(commandName) ?? new Collection();
    this.cooldowns.set(commandName, bucket);
    const expiresAt = bucket.get(userId);
    const now = Date.now();
    if (expiresAt && expiresAt > now) {
      return Math.ceil((expiresAt - now) / 1e3);
    }
    bucket.set(userId, now + seconds * 1e3);
    return null;
  }
  log = log;
};
var log2 = scopedLogger("database");
var connecting = null;
var BACKOFF_MS = [1e3, 2e3, 4e3, 8e3, 3e4];
async function attemptConnect(uri, attempt) {
  try {
    const conn = await mongoose7.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45e3,
      serverSelectionTimeoutMS: 5e3,
      heartbeatFrequencyMS: 1e4,
      bufferCommands: false
    });
    return conn;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
    log2.warn(`DB connection attempt ${attempt + 1} failed \u2014 retrying in ${delay / 1e3}s`, { error: message });
    await new Promise((r) => setTimeout(r, delay));
    return attemptConnect(uri, attempt + 1);
  }
}
async function connectDatabase() {
  if (mongoose7.connection.readyState === 1) return mongoose7;
  if (connecting) return connecting;
  const uri = requireEnv("MONGODB_URI");
  mongoose7.connection.on("connected", () => log2.info("MongoDB connected"));
  mongoose7.connection.on("disconnected", () => log2.warn("MongoDB disconnected \u2014 reconnecting\u2026"));
  mongoose7.connection.on("reconnected", () => log2.info("MongoDB reconnected"));
  mongoose7.connection.on("error", (err) => log2.error("MongoDB connection error", { error: err.message }));
  mongoose7.connection.on("close", () => log2.warn("MongoDB connection closed"));
  mongoose7.connection.on("disconnected", () => {
    connecting = null;
    connectDatabase().catch(
      (err) => log2.error("Auto-reconnect failed", { error: err instanceof Error ? err.message : String(err) })
    );
  });
  connecting = attemptConnect(uri, 0);
  await connecting;
  return mongoose7;
}
function isDatabaseConnected() {
  return mongoose7.connection.readyState === 1;
}
var AutoModSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    antiSpam: { type: Boolean, default: false },
    antiRaid: { type: Boolean, default: false },
    antiLink: { type: Boolean, default: false },
    antiInvite: { type: Boolean, default: false },
    antiMentionLimit: { type: Number, default: 0 },
    // 0 = disabled
    antiNsfw: { type: Boolean, default: false },
    antiScam: { type: Boolean, default: false },
    antiToxicity: { type: Boolean, default: false },
    antiAlt: { type: Boolean, default: false },
    antiBot: { type: Boolean, default: false },
    antiFlood: { type: Boolean, default: false },
    antiMassJoin: { type: Boolean, default: false },
    antiGhostPing: { type: Boolean, default: false },
    antiCaps: { type: Boolean, default: false },
    capsPercent: { type: Number, default: 70 },
    whitelistUsers: { type: [String], default: [] },
    whitelistRoles: { type: [String], default: [] },
    whitelistChannels: { type: [String], default: [] },
    linkWhitelistDomains: { type: [String], default: [] },
    badWords: { type: [String], default: [] }
  },
  { _id: false }
);
var AntiNukeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    whitelistUsers: { type: [String], default: [] },
    whitelistRoles: { type: [String], default: [] },
    thresholds: {
      channelDelete: { type: Number, default: 3 },
      channelCreate: { type: Number, default: 5 },
      roleDelete: { type: Number, default: 3 },
      ban: { type: Number, default: 3 },
      kick: { type: Number, default: 5 },
      webhookCreate: { type: Number, default: 3 }
    },
    windowSeconds: { type: Number, default: 10 },
    punishment: { type: String, enum: ["ban", "kick", "strip-roles"], default: "strip-roles" }
  },
  { _id: false }
);
var LoggingSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channels: { type: Map, of: String, default: {} },
    // eventKey -> channelId
    disabledEvents: { type: [String], default: [] },
    ignoredChannels: { type: [String], default: [] },
    ignoredUsers: { type: [String], default: [] },
    ignoredRoles: { type: [String], default: [] }
  },
  { _id: false }
);
var WelcomeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "Welcome to {server}, {mention}! You are member #{memberCount}." },
    embed: { type: Boolean, default: true },
    cardTemplate: { type: String, default: "default" },
    cardBackgroundUrl: { type: String, default: null }
  },
  { _id: false }
);
var GoodbyeSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "{user} has left {server}. We now have {memberCount} members." }
  },
  { _id: false }
);
var BoostMessageSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: "\u{1F389} {user} just boosted the server! Thank you!" }
  },
  { _id: false }
);
var VerificationSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    method: { type: String, enum: ["button", "captcha", "math", "image"], default: "button" },
    roleId: { type: String, default: null },
    channelId: { type: String, default: null },
    logChannelId: { type: String, default: null },
    timeoutMinutes: { type: Number, default: 10 }
  },
  { _id: false }
);
var TicketSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    logChannelId: { type: String, default: null },
    categoryId: { type: String, default: null },
    supportRoleId: { type: String, default: null },
    blacklistedUserIds: { type: [String], default: [] },
    nextTicketNumber: { type: Number, default: 1 }
  },
  { _id: false }
);
var LevelingSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    announceChannelId: { type: String, default: null },
    announceMessage: { type: String, default: "\u{1F389} GG {mention}, you've reached level **{level}**!" },
    announceInDm: { type: Boolean, default: false },
    xpMultiplier: { type: Number, default: 1 },
    ignoredChannels: { type: [String], default: [] },
    rewards: {
      type: [
        new Schema(
          { level: { type: Number, required: true }, roleId: { type: String, required: true } },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { _id: false }
);
var EconomySchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    multiplier: { type: Number, default: 1 }
  },
  { _id: false }
);
var CustomCommandSchema = new Schema(
  {
    name: { type: String, required: true },
    response: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => /* @__PURE__ */ new Date() }
  },
  { _id: false }
);
var AiAutoResponseSchema = new Schema(
  {
    trigger: { type: String, required: true },
    response: { type: String, default: null },
    // null = generate with AI dynamically
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => /* @__PURE__ */ new Date() }
  },
  { _id: false }
);
new Schema(
  {
    ticketAssist: { type: Boolean, default: false },
    personaName: { type: String, default: null },
    personaPrompt: { type: String, default: null },
    language: { type: String, default: "en" },
    aiModerationEnabled: { type: Boolean, default: false },
    autoResponses: { type: [AiAutoResponseSchema], default: [] }
  },
  { _id: false }
);
new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: () => /* @__PURE__ */ new Date() }
  },
  { _id: false }
);
new Schema(
  {
    id: { type: String, required: true },
    channelId: { type: String, required: true },
    message: { type: String, required: true },
    interval: { type: String, required: true },
    // cron expression
    enabled: { type: Boolean, default: true },
    createdBy: { type: String, required: true }
  },
  { _id: false }
);
var CommandPermissionSchema = new Schema(
  {
    command: { type: String, required: true },
    roleIds: { type: [String], default: [] }
  },
  { _id: false }
);
var guildSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    prefix: { type: String, default: "!" },
    language: { type: String, default: "en", enum: ["en", "fil", "ceb", "ilo", "ja", "ko"] },
    adminRoleIds: { type: [String], default: [] },
    modRoleIds: { type: [String], default: [] },
    djRoleIds: { type: [String], default: [] },
    muteRoleId: { type: String, default: null },
    verifiedRoleId: { type: String, default: null },
    premiumRoleId: { type: String, default: null },
    disabledCommands: { type: [String], default: [] },
    disabledChannelCommands: {
      type: [new Schema({ channelId: String, command: String }, { _id: false })],
      default: []
    },
    ignoredChannels: { type: [String], default: [] },
    ignoredUsers: { type: [String], default: [] },
    ignoredRoles: { type: [String], default: [] },
    commandPermissions: { type: [CommandPermissionSchema], default: [] },
    commandCooldowns: { type: Map, of: Number, default: {} },
    customCommands: { type: [CustomCommandSchema], default: [] },
    automod: { type: AutoModSchema, default: () => ({}) },
    antinuke: { type: AntiNukeSchema, default: () => ({}) },
    logging: { type: LoggingSchema, default: () => ({}) },
    welcome: { type: WelcomeSchema, default: () => ({}) },
    goodbye: { type: GoodbyeSchema, default: () => ({}) },
    boostMessage: { type: BoostMessageSchema, default: () => ({}) },
    verification: { type: VerificationSchema, default: () => ({}) },
    tickets: { type: TicketSettingsSchema, default: () => ({}) },
    leveling: { type: LevelingSchema, default: () => ({}) },
    economy: { type: EconomySchema, default: () => ({}) },
    shopItems: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, default: "" },
            stock: { type: Number, default: -1 }
            // -1 = unlimited
          },
          { _id: false }
        )
      ],
      default: []
    },
    autoRoleIds: { type: [String], default: [] },
    autoRoleEnabled: { type: Boolean, default: true },
    autoRoleBotId: { type: String, default: null },
    autoNicknameFormat: { type: String, default: null },
    suggestionChannelId: { type: String, default: null },
    suggestionVotesEnabled: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    lockedReason: { type: String, default: null },
    coverMode: { type: Boolean, default: false },
    raidMode: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          reason: { type: String, default: null },
          enabledAt: { type: Date, default: null },
          enabledBy: { type: String, default: null }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    music: {
      type: new Schema(
        {
          mode247: { type: Boolean, default: false },
          channelId247: { type: String, default: null },
          djMode: { type: Boolean, default: false }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    starboard: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          channelId: { type: String, default: null },
          threshold: { type: Number, default: 3 }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    socials: { type: Map, of: String, default: {} },
    reactionRoles: {
      type: [
        new Schema(
          {
            type: { type: String, enum: ["reaction", "button", "select", "color", "notification"], required: true },
            messageId: { type: String },
            channelId: { type: String },
            emoji: { type: String },
            roleId: { type: String },
            roleIds: { type: [String] },
            label: { type: String }
          },
          { _id: false }
        )
      ],
      default: []
    },
    colorRoles: {
      type: new Schema(
        { roleIds: { type: [String], default: [] } },
        { _id: false }
      ),
      default: () => ({})
    },
    notificationRoles: {
      type: [new Schema({ roleId: { type: String, required: true }, description: { type: String, default: "" } }, { _id: false })],
      default: []
    },
    vanityUrlCode: { type: String, default: null },
    onboarding: {
      enabled: { type: Boolean, default: false },
      steps: {
        type: [new Schema({ id: String, title: String, description: String }, { _id: false })],
        default: []
      }
    },
    // Self-assignable roles
    selfRoleIds: { type: [String], default: [] },
    // Boost perks
    boostPerkRoleIds: {
      type: [new Schema({ roleId: String, description: { type: String, default: "" } }, { _id: false })],
      default: []
    },
    // Appeal channel
    appealChannelId: { type: String, default: null },
    // Mod rotation schedule
    modRotation: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          userIds: { type: [String], default: [] },
          interval: { type: String, enum: ["daily", "weekly", "biweekly"], default: "weekly" },
          currentIndex: { type: Number, default: 0 },
          channelId: { type: String, default: null },
          lastRotationAt: { type: Date, default: null }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    // XP boost event
    xpBoostEvent: {
      type: new Schema(
        {
          active: { type: Boolean, default: false },
          multiplier: { type: Number, default: 2 },
          expiresAt: { type: Date, default: null },
          startedBy: { type: String, default: null }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    // Economy event
    economyEvent: {
      type: new Schema(
        {
          active: { type: Boolean, default: false },
          type: { type: String, default: null },
          expiresAt: { type: Date, default: null },
          startedBy: { type: String, default: null }
        },
        { _id: false }
      ),
      default: () => ({})
    },
    // Join gate (anti-alt, minimum account age)
    joinGate: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: false },
          minAccountAgeDays: { type: Number, default: 7 },
          kickMessage: { type: String, default: null }
        },
        { _id: false }
      ),
      default: () => ({})
    }
  },
  { timestamps: true }
);
var GuildModel = mongoose7.models["Guild"] ?? model("Guild", guildSchema);
var apiKeySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true },
    createdBy: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: null }
  },
  { timestamps: true }
);
var webhookSchema = new Schema(
  {
    guildId: { type: String, default: null },
    url: { type: String, required: true },
    events: { type: [String], default: [] },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);
var errorLogSchema = new Schema(
  {
    message: { type: String, required: true },
    stack: { type: String, default: null },
    context: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);
var featureFlagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);
var supportStaffSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    addedBy: { type: String, required: true },
    ticketsHandled: { type: Number, default: 0 },
    dmsSent: { type: Number, default: 0 }
  },
  { timestamps: true }
);
var feedbackSchema = new Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, default: null },
    content: { type: String, required: true },
    response: { type: String, default: null },
    respondedBy: { type: String, default: null }
  },
  { timestamps: true }
);
var translationSchema = new Schema(
  {
    language: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: String, required: true }
  },
  { timestamps: true }
);
translationSchema.index({ language: 1, key: 1 }, { unique: true });
var coOwnerSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    grantedBy: { type: String, required: true },
    permissions: { type: [String], default: ["*"] }
  },
  { timestamps: true }
);
var maintenanceStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "singleton" },
    enabled: { type: Boolean, default: false },
    reason: { type: String, default: null },
    message: { type: String, default: null }
  },
  { timestamps: true }
);
var systemSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "singleton" },
    analytics: {
      totalCommands: { type: Number, default: 0 },
      totalServers: { type: Number, default: 0 },
      totalUsers: { type: Number, default: 0 },
      dailyCommands: { type: Number, default: 0 },
      weeklyCommands: { type: Number, default: 0 },
      monthlyCommands: { type: Number, default: 0 }
    },
    globalDisabledCommands: { type: [String], default: [] },
    globalCooldowns: { type: Map, of: Number, default: {} },
    globalSlowmode: { type: Number, default: 0 },
    globalBans: { type: [String], default: [] },
    globalCustomCommands: { type: [new Schema({ name: String, response: String, createdBy: String }, { _id: false })], default: [] }
  },
  { timestamps: true }
);
mongoose7.models["System"] ?? model("System", systemSchema);
var ApiKeyModel = mongoose7.models["ApiKey"] ?? model("ApiKey", apiKeySchema);
mongoose7.models["Webhook"] ?? model("Webhook", webhookSchema);
mongoose7.models["ErrorLog"] ?? model("ErrorLog", errorLogSchema);
mongoose7.models["FeatureFlag"] ?? model("FeatureFlag", featureFlagSchema);
mongoose7.models["SupportStaff"] ?? model("SupportStaff", supportStaffSchema);
mongoose7.models["Feedback"] ?? model("Feedback", feedbackSchema);
mongoose7.models["Translation"] ?? model("Translation", translationSchema);
mongoose7.models["CoOwner"] ?? model("CoOwner", coOwnerSchema);
mongoose7.models["MaintenanceState"] ?? model("MaintenanceState", maintenanceStateSchema);
var modCaseSchema = new Schema(
  {
    caseId: { type: Number, required: true },
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    moderatorId: { type: String, required: true },
    type: {
      type: String,
      enum: ["warn", "mute", "unmute", "timeout", "untimeout", "kick", "ban", "tempban", "softban", "unban", "note"],
      required: true
    },
    reason: { type: String, default: "No reason provided" },
    duration: { type: Number, default: null },
    // ms
    expiresAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    editedReason: { type: String, default: null }
  },
  { timestamps: true }
);
modCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });
var staffNoteSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    note: { type: String, required: true }
  },
  { timestamps: true }
);
var globalBanSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "No reason provided" },
    moderatorId: { type: String, required: true }
  },
  { timestamps: true }
);
var blacklistSchema = new Schema(
  {
    entityId: { type: String, required: true, index: true },
    entityType: { type: String, enum: ["user", "server"], required: true },
    reason: { type: String, default: "No reason provided" },
    moderatorId: { type: String, required: true }
  },
  { timestamps: true }
);
blacklistSchema.index({ entityId: 1, entityType: 1 }, { unique: true });
var antiNukeIncidentSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    count: { type: Number, required: true },
    punishment: { type: String, required: true }
  },
  { timestamps: true }
);
var appealTicketSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    caseId: { type: Number, default: null },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    reviewedBy: { type: String, default: null },
    reviewReason: { type: String, default: null }
  },
  { timestamps: true }
);
var warningTemplateSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    reason: { type: String, required: true }
  },
  { timestamps: true }
);
warningTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
var ModCaseModel = mongoose7.models["ModCase"] ?? model("ModCase", modCaseSchema);
mongoose7.models["StaffNote"] ?? model("StaffNote", staffNoteSchema);
mongoose7.models["GlobalBan"] ?? model("GlobalBan", globalBanSchema);
mongoose7.models["Blacklist"] ?? model("Blacklist", blacklistSchema);
mongoose7.models["AntiNukeIncident"] ?? model("AntiNukeIncident", antiNukeIncidentSchema);
mongoose7.models["AppealTicket"] ?? model("AppealTicket", appealTicketSchema);
mongoose7.models["WarningTemplate"] ?? model("WarningTemplate", warningTemplateSchema);
var premiumHistoryEntrySchema = new Schema(
  {
    action: { type: String, enum: ["grant", "revoke", "upgrade", "downgrade", "refund"], required: true },
    tier: { type: String, default: null },
    moderatorId: { type: String, required: true },
    note: { type: String, default: null }
  },
  { timestamps: true }
);
var premiumSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["free", "basic", "standard", "gold", "enterprise"], default: "free" },
    grantedBy: { type: String, default: null },
    packId: { type: Schema.Types.ObjectId, ref: "ServerPack", default: null },
    active: { type: Boolean, default: false },
    history: { type: [premiumHistoryEntrySchema], default: [] }
  },
  { timestamps: true }
);
var premiumCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["basic", "standard", "gold", "enterprise"], required: true },
    createdBy: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedBy: { type: String, default: null },
    usedInGuildId: { type: String, default: null },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);
var serverPackSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    packType: { type: String, enum: ["pack3", "pack5", "pack10"], required: true },
    guildIds: { type: [String], default: [] },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
var priceHistorySchema = new Schema(
  {
    target: { type: String, required: true },
    // tier name or pack name
    kind: { type: String, enum: ["tier", "pack", "discount"], required: true },
    oldValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    changedBy: { type: String, required: true }
  },
  { timestamps: true }
);
var licenseSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    licenseKey: { type: String, required: true, unique: true },
    whiteLabelName: { type: String, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);
var betaFlagSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true }
  },
  { timestamps: true }
);
var rateLimitExemptSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true }
  },
  { timestamps: true }
);
var PremiumModel = mongoose7.models["Premium"] ?? model("Premium", premiumSchema);
mongoose7.models["PremiumCode"] ?? model("PremiumCode", premiumCodeSchema);
mongoose7.models["ServerPack"] ?? model("ServerPack", serverPackSchema);
mongoose7.models["PriceHistory"] ?? model("PriceHistory", priceHistorySchema);
mongoose7.models["License"] ?? model("License", licenseSchema);
mongoose7.models["BetaFlag"] ?? model("BetaFlag", betaFlagSchema);
mongoose7.models["RateLimitExempt"] ?? model("RateLimitExempt", rateLimitExemptSchema);

// src/utils/premium.ts
async function getGuildTier(guildId) {
  const record = await PremiumModel.findOne({ guildId }).lean();
  if (!record || !record.active) return "free";
  return record.tier ?? "free";
}

// src/handlers/commandHandler.ts
var __filename$1 = fileURLToPath(import.meta.url);
var __dirname$1 = path3.dirname(__filename$1);
var _require = createRequire(import.meta.url);
var log3 = scopedLogger("commands");
function walk(dir) {
  const entries = fs2.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path3.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}
async function loadCommands(client) {
  const commandsDir = path3.join(__dirname$1, "..", "commands");
  if (!fs2.existsSync(commandsDir)) {
    log3.warn("Commands directory not found", { commandsDir });
    return 0;
  }
  const files = walk(commandsDir);
  let loaded = 0;
  for (const file of files) {
    try {
      const mod = _require(file);
      let rawCommand = mod.default ?? mod.command;
      if (rawCommand && typeof rawCommand === "object" && !("name" in rawCommand) && "data" in rawCommand) {
        const legacy = rawCommand;
        const tierMap = {
          user: "general",
          general: "general",
          mod: "moderator",
          moderator: "moderator",
          admin: "admin",
          owner: "owner",
          coowner: "coowner"
        };
        const oldExecute = legacy.execute.bind(legacy);
        const cmdName = legacy.data.name;
        rawCommand = {
          name: cmdName,
          description: legacy.data.description ?? "No description",
          category: legacy.category ?? "General",
          access: tierMap[legacy.accessTier ?? "general"] ?? "general",
          guildOnly: true,
          async execute(ctx) {
            if (ctx.isSlash) await oldExecute(ctx.interaction);
            else await ctx.reply({ content: `This command only supports slash. Use \`/${cmdName}\`.` });
          }
        };
      }
      const command = rawCommand;
      if (!command || !command.name || typeof command.execute !== "function") {
        log3.warn(`Skipping malformed command file (missing name or execute)`, { file });
        continue;
      }
      if (!command.description) log3.warn(`Command "${command.name}" is missing a description`, { file });
      if (!command.category) log3.warn(`Command "${command.name}" is missing a category`, { file });
      if (client.commands.has(command.name)) {
        log3.warn(`Duplicate command name "${command.name}" in ${file} \u2014 skipping`);
        continue;
      }
      const featureKey = command.category.toLowerCase();
      if (!isFeatureEnabled(featureKey)) {
        log3.debug(`Skipping command "${command.name}" \u2014 feature "${featureKey}" is disabled in config.json`);
        continue;
      }
      client.commands.set(command.name, command);
      for (const alias of command.aliases ?? []) {
        if (client.aliases.has(alias)) {
          log3.warn(`Duplicate alias "${alias}" for command "${command.name}" \u2014 skipping alias`);
          continue;
        }
        client.aliases.set(alias, command.name);
      }
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log3.error(`Failed to load command file: ${file}`, { error: message });
    }
  }
  for (const command of client.commands.values()) {
    if (command.registerComponents) {
      try {
        command.registerComponents(client);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log3.error(`registerComponents failed for "${command.name}"`, { error: message });
      }
    }
  }
  log3.info(`Loaded ${loaded} commands from ${files.length} files`);
  return loaded;
}
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var _require2 = createRequire(import.meta.url);
var log4 = scopedLogger("events");
async function loadEvents(client) {
  const eventsDir = path3.join(__dirname2, "..", "events");
  if (!fs2.existsSync(eventsDir)) {
    log4.warn("Events directory not found", { eventsDir });
    return 0;
  }
  const files = fs2.readdirSync(eventsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
  let loaded = 0;
  for (const file of files) {
    const full = path3.join(eventsDir, file);
    try {
      const mod = _require2(full);
      const event = mod.default ?? mod.event;
      if (!event) {
        log4.warn(`Event file has no default export \u2014 skipping`, { file });
        continue;
      }
      if (!event.name) {
        log4.warn(`Event file is missing "name" field \u2014 skipping`, { file });
        continue;
      }
      if (typeof event.execute !== "function") {
        log4.warn(`Event "${event.name}" is missing "execute" function \u2014 skipping`, { file });
        continue;
      }
      const handler = (...args) => {
        Promise.resolve(event.execute(client, ...args)).catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : void 0;
          log4.error(`Unhandled error in event "${event.name}"`, { error: message, stack });
        });
      };
      if (event.once) client.once(event.name, handler);
      else client.on(event.name, handler);
      client.events.set(event.name, event);
      loaded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log4.error(`Failed to load event file: ${file}`, { error: message });
    }
  }
  log4.info(`Loaded ${loaded} events from ${files.length} files`);
  return loaded;
}
var log5 = scopedLogger("music");
function initLavalink(client) {
  const host = process.env.LAVALINK_HOST;
  const port = process.env.LAVALINK_PORT;
  const password = process.env.LAVALINK_PASSWORD;
  if (!host || !port || !password) {
    log5.warn("Lavalink credentials not set \u2014 music commands will be unavailable until LAVALINK_HOST/PORT/PASSWORD are configured");
    return;
  }
  client.lavalink = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host,
        port: Number(port),
        authorization: password,
        secure: process.env.LAVALINK_SECURE === "true"
      }
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: { id: client.user?.id ?? "0", username: "Panindigan" },
    autoSkip: true,
    playerOptions: {
      defaultSearchPlatform: "ytsearch",
      volumeDecrementer: 1
    }
  });
  client.lavalink.nodeManager.on("connect", (node) => log5.info(`Lavalink node "${node.id}" connected`));
  client.lavalink.nodeManager.on("error", (node, error) => log5.error(`Lavalink node "${node.id}" error`, { error: String(error) }));
  client.lavalink.nodeManager.on("disconnect", (node) => log5.warn(`Lavalink node "${node.id}" disconnected`));
  client.on("raw", (d) => client.lavalink?.sendRawData(d));
  client.once("clientReady", () => client.lavalink?.init({ id: client.user.id, username: client.user.username }));
}
var log6 = scopedLogger("api");
function startApiServer(client) {
  if (!client.config.api?.enabled) return;
  const app = express();
  app.use(express.json());
  app.use(async (req, res, next) => {
    const key = req.header("x-api-key");
    if (!key) return res.status(401).json({ error: "Missing X-API-Key header" });
    const record = await ApiKeyModel.findOne({ key, revoked: false });
    if (!record) return res.status(403).json({ error: "Invalid or revoked API key" });
    record.lastUsedAt = /* @__PURE__ */ new Date();
    await record.save();
    req.apiGuildId = record.guildId;
    next();
  });
  app.get("/v1/guild", async (req, res) => {
    const guildId = req.apiGuildId;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Bot is not in that guild" });
    const config2 = await GuildModel.findOne({ guildId }).lean();
    const tier = await getGuildTier(guildId);
    res.json({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      premiumTier: tier,
      prefix: config2?.prefix ?? client.config.bot.defaultPrefix
    });
  });
  app.get("/v1/guild/stats", async (req, res) => {
    const guildId = req.apiGuildId;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Bot is not in that guild" });
    res.json({
      members: guild.memberCount,
      channels: guild.channels.cache.size,
      roles: guild.roles.cache.size,
      boostLevel: guild.premiumTier
    });
  });
  const port = Number(process.env.API_PORT ?? 3001);
  app.listen(port, () => log6.info(`REST API listening on port ${port}`));
}
var InventoryItemSchema = new Schema(
  { itemId: String, name: String, quantity: { type: Number, default: 1 } },
  { _id: false }
);
var GuildProfileSchema = new Schema(
  {
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    lastXpAt: { type: Date, default: null },
    voiceXp: { type: Number, default: 0 },
    prestige: { type: Number, default: 0 },
    balance: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
    inventory: { type: [InventoryItemSchema], default: [] },
    lastDaily: { type: Date, default: null },
    lastWeekly: { type: Date, default: null },
    lastMonthly: { type: Date, default: null },
    lastWork: { type: Date, default: null },
    lastBeg: { type: Date, default: null },
    lastCrime: { type: Date, default: null },
    lastDailyXp: { type: Date, default: null },
    lastWeeklyXp: { type: Date, default: null },
    lastHunting: { type: Date, default: null },
    lastFishing: { type: Date, default: null },
    lastMining: { type: Date, default: null },
    jobId: { type: String, default: null },
    fishingRod: { type: Number, default: 0 },
    pickaxe: { type: Number, default: 0 },
    rankCardBackground: { type: String, default: null },
    rankCardColor: { type: String, default: null },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesTied: { type: Number, default: 0 },
    totalGambled: { type: Number, default: 0 },
    totalGambledWon: { type: Number, default: 0 },
    farmPlots: {
      type: [new Schema({
        crop: { type: String, default: null },
        plantedAt: { type: Date, default: null },
        wateredAt: { type: Date, default: null },
        harvestAt: { type: Date, default: null },
        upgraded: { type: Boolean, default: false }
      }, { _id: false })],
      default: []
    },
    petData: { type: Schema.Types.Mixed, default: null },
    businessData: { type: Schema.Types.Mixed, default: null },
    investmentPortfolio: {
      type: [new Schema({
        ticker: { type: String, required: true },
        shares: { type: Number, default: 0 },
        avgBuyPrice: { type: Number, default: 0 }
      }, { _id: false })],
      default: []
    },
    lotteryTickets: { type: Number, default: 0 }
  },
  { _id: false }
);
var ReminderSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    remindAt: { type: Date, required: true },
    channelId: { type: String, required: true },
    createdAt: { type: Date, default: () => /* @__PURE__ */ new Date() }
  },
  { _id: false }
);
var userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    globalXp: { type: Number, default: 0 },
    guilds: { type: [GuildProfileSchema], default: [] },
    afk: {
      active: { type: Boolean, default: false },
      reason: { type: String, default: null },
      since: { type: Date, default: null }
    },
    reminders: { type: [ReminderSchema], default: [] },
    badges: { type: [String], default: [] },
    reputation: { type: Number, default: 0 },
    aiMessagesUsedToday: { type: Number, default: 0 },
    aiUsageResetAt: { type: Date, default: null }
  },
  { timestamps: true }
);
userSchema.index({ "guilds.guildId": 1, userId: 1 });
userSchema.methods.getGuildProfile = function(guildId) {
  let profile = this.guilds.find((g) => g.guildId === guildId);
  if (!profile) {
    this.guilds.push({ guildId });
    profile = this.guilds[this.guilds.length - 1];
  }
  return profile;
};
var UserModel = mongoose7.models["User"] ?? model("User", userSchema);
function baseEmbed(color = "primary") {
  return new EmbedBuilder().setColor(config.colors[color]).setTimestamp();
}

// src/features/scheduler/reminderScheduler.ts
var log7 = scopedLogger("scheduler:reminders");
function startReminderScheduler(client) {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const users = await UserModel.find({ "reminders.remindAt": { $lte: now } });
      for (const user of users) {
        const due = user.reminders.filter((r) => r.remindAt <= now);
        for (const reminder of due) {
          const channel = client.channels.cache.get(reminder.channelId);
          if (channel?.isTextBased()) {
            await channel.send({ content: `<@${user.userId}>`, embeds: [baseEmbed("info").setTitle("\u23F0 Reminder").setDescription(reminder.text)] }).catch(() => {
            });
          }
        }
        user.reminders = user.reminders.filter((r) => r.remindAt > now);
        await user.save();
      }
    } catch (err) {
      log7.error("Reminder sweep failed", { error: err.message });
    }
  });
}
var giveawaySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    prize: { type: String, required: true },
    winnerCount: { type: Number, default: 1 },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    paused: { type: Boolean, default: false },
    participants: { type: [String], default: [] },
    winners: { type: [String], default: [] },
    bonusEntryRoleIds: { type: [String], default: [] },
    bonusEntryCounts: { type: Map, of: Number, default: {} },
    // roleId -> extraEntries
    requiredRoleId: { type: String, default: null },
    requiredLevel: { type: Number, default: null },
    requiredBalance: { type: Number, default: null },
    blacklistedUsers: { type: [String], default: [] }
  },
  { timestamps: true }
);
var suggestionSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "denied", "considered"], default: "pending" },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    approvedBy: { type: String, default: null },
    deniedBy: { type: String, default: null },
    staffNote: { type: String, default: null }
  },
  { timestamps: true }
);
var serverBackupSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);
var serverTemplateSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);
serverTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
var announcementTemplateSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    title: { type: String, default: null },
    description: { type: String, required: true },
    color: { type: String, default: null }
  },
  { timestamps: true }
);
announcementTemplateSchema.index({ guildId: 1, name: 1 }, { unique: true });
var savedQueueSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    tracks: { type: [Schema.Types.Mixed], default: [] }
  },
  { timestamps: true }
);
savedQueueSchema.index({ guildId: 1, userId: 1, name: 1 }, { unique: true });
var reactionRoleSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    emoji: { type: String, required: true },
    roleId: { type: String, required: true }
  },
  { timestamps: true }
);
reactionRoleSchema.index({ guildId: 1, messageId: 1, emoji: 1 }, { unique: true });
var buttonRolePanelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    title: { type: String, default: "Role Selection" },
    description: { type: String, default: "Click a button to get a role." },
    buttons: {
      type: [new Schema({ roleId: String, label: String, emoji: String, style: { type: Number, default: 1 } }, { _id: false })],
      default: []
    }
  },
  { timestamps: true }
);
var selectRolePanelSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, default: null },
    placeholder: { type: String, default: "Select a role..." },
    minValues: { type: Number, default: 0 },
    maxValues: { type: Number, default: 1 },
    options: {
      type: [new Schema({ roleId: String, label: String, description: String, emoji: String }, { _id: false })],
      default: []
    }
  },
  { timestamps: true }
);
var colorRoleSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, default: null },
    messageId: { type: String, default: null },
    roleIds: { type: [String], default: [] }
  },
  { timestamps: true }
);
var starboardSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    channelId: { type: String, required: true },
    threshold: { type: Number, default: 3 },
    enabled: { type: Boolean, default: true },
    starredMessages: { type: [String], default: [] }
    // original messageIds already posted
  },
  { timestamps: true }
);
var pollSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true, unique: true },
    authorId: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    votes: { type: Map, of: String, default: {} },
    // userId -> optionIndex string
    ended: { type: Boolean, default: false },
    endsAt: { type: Date, default: null }
  },
  { timestamps: true }
);
var tempRoleSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    assignedBy: { type: String, required: true }
  },
  { timestamps: true }
);
var serverStatsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    memberCountChannelId: { type: String, default: null },
    botCountChannelId: { type: String, default: null },
    onlineCountChannelId: { type: String, default: null },
    channelCountChannelId: { type: String, default: null },
    roleCountChannelId: { type: String, default: null },
    enabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);
var inviteTrackingSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    inviterId: { type: String, required: true },
    inviteCode: { type: String, required: true },
    uses: { type: Number, default: 0 }
  },
  { timestamps: true }
);
inviteTrackingSchema.index({ guildId: 1, inviteCode: 1 }, { unique: true });
var birthdaySchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    month: { type: Number, required: true },
    // 1-12
    day: { type: Number, required: true },
    // 1-31
    guildIds: { type: [String], default: [] }
  },
  { timestamps: true }
);
birthdaySchema.index({ month: 1, day: 1 });
var GiveawayModel = mongoose7.models["Giveaway"] ?? model("Giveaway", giveawaySchema);
var BirthdayModel = mongoose7.models["Birthday"] ?? model("Birthday", birthdaySchema);
mongoose7.models["Suggestion"] ?? model("Suggestion", suggestionSchema);
mongoose7.models["ServerBackup"] ?? model("ServerBackup", serverBackupSchema);
mongoose7.models["ServerTemplate"] ?? model("ServerTemplate", serverTemplateSchema);
mongoose7.models["AnnouncementTemplate"] ?? model("AnnouncementTemplate", announcementTemplateSchema);
mongoose7.models["SavedQueue"] ?? model("SavedQueue", savedQueueSchema);
mongoose7.models["ReactionRole"] ?? model("ReactionRole", reactionRoleSchema);
mongoose7.models["ButtonRolePanel"] ?? model("ButtonRolePanel", buttonRolePanelSchema);
mongoose7.models["SelectRolePanel"] ?? model("SelectRolePanel", selectRolePanelSchema);
mongoose7.models["ColorRole"] ?? model("ColorRole", colorRoleSchema);
mongoose7.models["Starboard"] ?? model("Starboard", starboardSchema);
mongoose7.models["Poll"] ?? model("Poll", pollSchema);
mongoose7.models["TempRole"] ?? model("TempRole", tempRoleSchema);
mongoose7.models["ServerStats"] ?? model("ServerStats", serverStatsSchema);
mongoose7.models["InviteTracking"] ?? model("InviteTracking", inviteTrackingSchema);

// src/features/scheduler/giveawayScheduler.ts
var log8 = scopedLogger("scheduler:giveaways");
function pickWinners(participants, count) {
  const pool = [...participants];
  const winners = [];
  while (pool.length && winners.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}
function startGiveawayScheduler(client) {
  cron.schedule("*/15 * * * * *", async () => {
    try {
      const due = await GiveawayModel.find({ ended: false, endsAt: { $lte: /* @__PURE__ */ new Date() } });
      for (const giveaway of due) {
        giveaway.ended = true;
        const winners = pickWinners(giveaway.participants, giveaway.winnerCount);
        giveaway.winners = winners;
        await giveaway.save();
        const channel = client.channels.cache.get(giveaway.channelId);
        if (channel?.isTextBased()) {
          const description = winners.length ? `Congratulations ${winners.map((w) => `<@${w}>`).join(", ")}! You won **${giveaway.prize}**!` : "No valid entries \u2014 no winner could be determined.";
          await channel.send({ embeds: [baseEmbed("premium").setTitle("\u{1F389} Giveaway Ended!").setDescription(description)] }).catch(() => {
          });
        }
      }
    } catch (err) {
      log8.error("Giveaway sweep failed", { error: err.message });
    }
  });
}
var log9 = scopedLogger("scheduler:premium-audit");
function startPremiumExpiryAudit() {
  cron.schedule("0 * * * *", () => {
    log9.debug("Premium integrity audit tick (no-op: premium is permanent by design)");
  });
}
var log10 = scopedLogger("tempban-scheduler");
function startTempbanScheduler(client) {
  cron.schedule("* * * * *", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const expiredBans = await ModCaseModel.find({
        type: "tempban",
        active: true,
        expiresAt: { $lte: now }
      }).lean();
      for (const ban of expiredBans) {
        const guild = client.guilds.cache.get(ban.guildId);
        if (!guild) continue;
        try {
          await guild.bans.remove(ban.userId, "Temporary ban expired");
          await ModCaseModel.findByIdAndUpdate(ban._id, { $set: { active: false } });
          log10.info(`Unbanned user ${ban.userId} from guild ${ban.guildId} \u2014 tempban expired`);
        } catch (err) {
          if (err?.code !== 10026) {
            log10.warn(`Failed to unban ${ban.userId} from ${ban.guildId}: ${err.message}`);
          }
          await ModCaseModel.findByIdAndUpdate(ban._id, { $set: { active: false } }).catch(() => {
          });
        }
      }
    } catch (err) {
      log10.error(`Tempban scheduler error: ${err.message}`);
    }
  });
  log10.info("Tempban scheduler started (every minute)");
}
var log11 = scopedLogger("birthday-scheduler");
function startBirthdayScheduler(client) {
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = /* @__PURE__ */ new Date();
      const month = now.getUTCMonth() + 1;
      const day = now.getUTCDate();
      const birthdays = await BirthdayModel.find({ month, day }).lean();
      if (!birthdays.length) return;
      for (const bday of birthdays) {
        for (const guildId of bday.guildIds ?? []) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;
          const cfg = await GuildModel.findOne({ guildId }).lean();
          const birthdayChannelId = cfg?.birthdayChannelId;
          const birthdayRoleId = cfg?.birthdayRoleId;
          if (birthdayChannelId) {
            const ch = guild.channels.cache.get(birthdayChannelId);
            if (ch?.isTextBased()) {
              const user = await client.users.fetch(bday.userId).catch(() => null);
              const msg = cfg?.birthdayMessage ?? "\u{1F382} Happy Birthday {mention}! Wishing you an amazing day! \u{1F389}";
              const formatted = msg.replace("{user}", user?.username ?? `<@${bday.userId}>`).replace("{mention}", `<@${bday.userId}>`).replace("{server}", guild.name);
              const embed = baseEmbed("warning").setTitle("\u{1F382} Happy Birthday!").setDescription(formatted).setThumbnail(user?.displayAvatarURL() ?? null).setTimestamp();
              await ch.send({ embeds: [embed] }).catch((err) => {
                log11.warn(`Failed to send birthday message in ${guildId}: ${err.message}`);
              });
            }
          }
          if (birthdayRoleId) {
            const member = await guild.members.fetch(bday.userId).catch(() => null);
            if (member) {
              await member.roles.add(birthdayRoleId, "Birthday role").catch(() => {
              });
              setTimeout(async () => {
                const m = await guild.members.fetch(bday.userId).catch(() => null);
                await m?.roles.remove(birthdayRoleId, "Birthday role expired").catch(() => {
                });
              }, 24 * 60 * 60 * 1e3);
            }
          }
        }
      }
    } catch (err) {
      log11.error(`Birthday scheduler error: ${err.message}`);
    }
  });
  log11.info("Birthday scheduler started (daily at 08:00 UTC)");
}

// src/structures/Monitor.ts
var log12 = scopedLogger("monitor");
var DEFAULT_THRESHOLDS = {
  heapWarnMB: 512,
  heapAlertMB: 768,
  cpuWarnPct: 80,
  pingWarnMs: 400,
  slowQueryMs: 200,
  msgCacheWarn: 1e4
};
async function sampleCpuPercent(sampleMs = 100) {
  const before = process.cpuUsage();
  const t0 = Date.now();
  await new Promise((r) => setTimeout(r, sampleMs));
  const delta = process.cpuUsage(before);
  const elapsedUs = (Date.now() - t0) * 1e3;
  const cpuUs = delta.user + delta.system;
  return Math.min(100, Math.round(cpuUs / elapsedUs * 100));
}
function collectStats(client) {
  const mem = process.memoryUsage();
  const heapUsedMB = mem.heapUsed / 1048576;
  const heapTotalMB = mem.heapTotal / 1048576;
  let messageCache = 0;
  for (const channel of client.channels.cache.values()) {
    const ch = channel;
    if ("messages" in channel && ch.messages?.cache?.size) {
      messageCache += ch.messages.cache.size;
    }
  }
  return {
    heapUsedMB: Math.round(heapUsedMB * 10) / 10,
    heapTotalMB: Math.round(heapTotalMB * 10) / 10,
    wsPingMs: client.ws.ping,
    dbConnected: isDatabaseConnected(),
    uptimeSeconds: Math.floor(process.uptime()),
    guildCount: client.guilds.cache.size,
    userCount: client.users.cache.size,
    channelCount: client.channels.cache.size,
    messageCache,
    shardCount: client.shard?.count ?? 1,
    cpuPercent: 0
    // filled in asynchronously by the monitor
  };
}
var Monitor = class {
  client;
  thresholds;
  intervals = [];
  /** Rolling buffer of recent CPU samples for sustained-load detection. */
  cpuSamples = [];
  constructor(client, thresholds = {}) {
    this.client = client;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }
  /** Start all monitoring loops. */
  start() {
    this.intervals.push(
      setInterval(() => this.checkMemory(), 6e4).unref(),
      setInterval(() => void this.checkCpu(), 1e4).unref(),
      // sample every 10 s
      setInterval(() => this.checkPing(), 3e4).unref(),
      setInterval(() => this.checkDatabase(), 6e4).unref(),
      setInterval(() => this.checkCache(), 6e5).unref(),
      setInterval(() => this.logShards(), 3e5).unref()
    );
    log12.info("Monitoring subsystem started", {
      intervals: this.intervals.length,
      thresholds: this.thresholds
    });
  }
  /** Stop all monitoring loops. */
  stop() {
    for (const interval of this.intervals) clearInterval(interval);
    this.intervals.length = 0;
    this.cpuSamples = [];
    log12.info("Monitoring subsystem stopped");
  }
  // ── Individual checks ─────────────────────────────────────────────────────
  checkMemory() {
    const mem = process.memoryUsage();
    const mb = Math.round(mem.heapUsed / 1048576);
    const total = Math.round(mem.heapTotal / 1048576);
    if (mb >= this.thresholds.heapAlertMB) {
      log12.error(`\u{1F6A8} HEAP ALERT: ${mb} MB used / ${total} MB total \u2014 consider restarting`, { heapMB: mb });
    } else if (mb >= this.thresholds.heapWarnMB) {
      log12.warn(`\u{1F7E1} Heap warning: ${mb} MB used / ${total} MB total`, { heapMB: mb });
    } else {
      log12.debug(`Heap OK: ${mb} MB used / ${total} MB total`, { heapMB: mb });
    }
  }
  /**
   * Sample CPU usage over 100 ms, keep a rolling window of 5 samples,
   * and warn if all 5 consecutive samples exceed the threshold (sustained load).
   */
  async checkCpu() {
    const pct = await sampleCpuPercent(100);
    this.cpuSamples.push(pct);
    if (this.cpuSamples.length > 5) this.cpuSamples.shift();
    const sustained = this.cpuSamples.length === 5 && this.cpuSamples.every((s) => s >= this.thresholds.cpuWarnPct);
    if (sustained) {
      const avg = Math.round(this.cpuSamples.reduce((a, b) => a + b, 0) / 5);
      log12.warn(`\u{1F7E1} PERF: Sustained high CPU usage (avg ${avg}% over last 5 samples, threshold ${this.thresholds.cpuWarnPct}%)`, { cpuPct: avg });
    } else {
      log12.debug(`CPU sample: ${pct}%`, { cpuPct: pct });
    }
  }
  checkPing() {
    const ping = this.client.ws.ping;
    if (ping >= this.thresholds.pingWarnMs) {
      log12.warn(`\u{1F7E1} High WS ping: ${ping} ms`, { pingMs: ping });
    } else {
      log12.debug(`WS ping OK: ${ping} ms`, { pingMs: ping });
    }
  }
  checkDatabase() {
    const connected = isDatabaseConnected();
    if (!connected) {
      log12.error("\u{1F6A8} Database disconnected \u2014 reconnect in progress", { connected });
    } else {
      log12.debug("Database health OK", { connected });
    }
  }
  checkCache() {
    const stats = collectStats(this.client);
    const { messageCache, guildCount, userCount, channelCount } = stats;
    log12.info("Cache snapshot", { guilds: guildCount, users: userCount, channels: channelCount, messages: messageCache });
    if (messageCache >= this.thresholds.msgCacheWarn) {
      log12.warn(`\u{1F7E1} Message cache is large: ${messageCache} entries (threshold ${this.thresholds.msgCacheWarn})`, { messageCache });
    }
  }
  logShards() {
    const count = this.client.shard?.count ?? 1;
    log12.info("Shard status", { shardCount: count, wsPingMs: this.client.ws.ping, guilds: this.client.guilds.cache.size });
  }
};

// src/index.ts
var VERSION = "0.1.7";
var log13 = scopedLogger("bootstrap");
async function phase(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - t0;
    log13.info(`\u2714 ${name}`, { durationMs });
    return { phase: name, success: true, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - t0;
    log13.error(`\u2716 ${name} failed`, { error: message, durationMs });
    return { phase: name, success: false, durationMs, detail: message };
  }
}
async function main() {
  const bootStart = Date.now();
  printBanner(VERSION);
  log13.info("Starting up\u2026");
  const { missing, optionalMissing } = validateEnv();
  if (missing.length) {
    log13.error("Missing required environment variables \u2014 refusing to start", {
      missing: missing.map((m) => `${m.key} (${m.description})`)
    });
    process.exit(1);
  }
  if (optionalMissing.length) {
    log13.warn("Optional env vars not set \u2014 related features disabled", {
      optional: optionalMissing.map((m) => m.key)
    });
  }
  const dbResult = await phase("Database connect", () => connectDatabase());
  if (!dbResult.success) {
    log13.error("Cannot start without a database connection. Check MONGODB_URI.");
    process.exit(1);
  }
  const client = new PanindiganClient();
  const [cmdResult, evtResult] = await Promise.all([
    phase("Load commands", () => loadCommands(client)),
    phase("Load events", () => loadEvents(client))
  ]);
  await phase("Init Lavalink", async () => initLavalink(client));
  await phase("Start REST API", async () => startApiServer(client));
  await phase("Start schedulers", async () => {
    startReminderScheduler(client);
    startGiveawayScheduler(client);
    startPremiumExpiryAudit();
    startTempbanScheduler(client);
    startBirthdayScheduler(client);
  });
  const loginResult = await phase("Discord login", () => client.login(requireEnv("DISCORD_TOKEN")));
  if (!loginResult.success) {
    log13.error("Discord login failed. Check DISCORD_TOKEN.");
    process.exit(1);
  }
  client.once("clientReady", () => {
    const monitor = new Monitor(client);
    monitor.start();
    const totalMs = Date.now() - bootStart;
    const mem = process.memoryUsage();
    const heapMB = Math.round(mem.heapUsed / 1048576);
    log13.info("\u2550\u2550\u2550 Startup complete \u2550\u2550\u2550", {
      version: VERSION,
      totalDurationMs: totalMs,
      commands: client.commands.size,
      events: client.events.size,
      guilds: client.guilds.cache.size,
      heapMB
    });
  });
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : void 0;
  log13.error("Fatal error during bootstrap", { error: message, stack });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : void 0;
  log13.error("Unhandled promise rejection", { error: message, stack });
});
process.on("uncaughtException", (err) => {
  log13.error("Uncaught exception \u2014 process will continue", { error: err.message, stack: err.stack });
});
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map