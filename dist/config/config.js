import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
/**
 * Runtime-reloadable config cache.
 * config.json is re-read from disk at most once every CONFIG_TTL_MS (60 s).
 * Changes to non-sensitive settings take effect without restarting the bot.
 */
const CONFIG_TTL_MS = 60_000;
const configPath = path.resolve(process.cwd(), "config.json");
let _configCache = null;
function resolveEnvRefs(value) {
    if (typeof value === "string" && value.startsWith("env:")) {
        const key = value.slice(4);
        return process.env[key] ?? undefined;
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
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return resolveEnvRefs(raw);
}
/**
 * Returns the resolved config object.
 * Re-reads config.json from disk if the 60 s TTL has expired.
 */
export function getConfig() {
    const now = Date.now();
    if (!_configCache || now > _configCache.expiresAt) {
        _configCache = { value: readConfigFromDisk(), expiresAt: now + CONFIG_TTL_MS };
    }
    return _configCache.value;
}
/**
 * Force-invalidate the config cache (e.g. after a hot-reload command).
 */
export function invalidateConfigCache() {
    _configCache = null;
}
/** Eagerly loaded once at import time so existing `config` references still work. */
export const config = readConfigFromDisk();
export const ENV_SCHEMA = [
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
    { key: "SESSION_SECRET", required: false, description: "Session secret for the REST API" },
];
export function getEnv(key) {
    return process.env[key];
}
export function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable "${key}". Set it in Replit Secrets (or .env locally) before starting the bot.`);
    }
    return value;
}
export function getOwnerIds() {
    return (process.env.BOT_OWNER_IDS ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
}
export function validateEnv() {
    const missing = [];
    const optionalMissing = [];
    for (const entry of ENV_SCHEMA) {
        if (!process.env[entry.key]) {
            if (entry.required)
                missing.push(entry);
            else
                optionalMissing.push(entry);
        }
    }
    return { missing, optionalMissing };
}
/**
 * Returns true when a named feature flag is enabled in config.json.
 * Defaults to true when the flag is absent (opt-out model).
 */
export function isFeatureEnabled(feature) {
    const cfg = getConfig();
    const features = cfg["features"];
    if (!features)
        return true;
    return features[feature] !== false;
}
//# sourceMappingURL=config.js.map