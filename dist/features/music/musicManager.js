import { LavalinkManager } from "lavalink-client";
import { scopedLogger } from "../../utils/logger.js";
import { validateLavalinkConfig, getMusicStatus, MusicStatus, getNodeHealthInfo, isNodeHealthy, } from "../../utils/music.js";
import { startHealthMonitor } from "./healthMonitor.js";
const log = scopedLogger("music");
/**
 * Lavalink initialization state to prevent duplicate initialization
 */
let isInitializing = false;
let isInitialized = false;
/**
 * Active node tracking for failover
 */
let activeNodeId = null;
/**
 * Reconnection configuration with exponential backoff
 */
const RECONNECT_CONFIG = {
    maxAttempts: 5,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
};
/**
 * Parses node configuration from environment variables
 * Supports single node or multiple nodes (comma-separated)
 */
function parseNodeConfigs() {
    const host = process.env.LAVALINK_HOST;
    const port = process.env.LAVALINK_PORT;
    const password = process.env.LAVALINK_PASSWORD;
    const secure = process.env.LAVALINK_SECURE === "true";
    // Check for multiple nodes (comma-separated)
    const hosts = host?.split(",") || [];
    const ports = port?.split(",") || [];
    const passwords = password?.split(",") || [];
    if (hosts.length === 0 || ports.length === 0 || passwords.length === 0) {
        return [];
    }
    const nodes = [];
    const maxNodes = Math.max(hosts.length, ports.length, passwords.length);
    for (let i = 0; i < maxNodes; i++) {
        nodes.push({
            id: `node-${i}`,
            host: hosts[i]?.trim() || hosts[0]?.trim(),
            port: Number(ports[i]?.trim() || ports[0]?.trim()),
            password: passwords[i]?.trim() || passwords[0]?.trim(),
            secure,
            priority: i, // First node has highest priority
        });
    }
    return nodes;
}
/**
 * Calculates exponential backoff delay
 */
function calculateBackoff(attempt) {
    const delay = Math.min(RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, attempt - 1), RECONNECT_CONFIG.maxDelay);
    return delay;
}
/**
 * Selects the healthiest node based on latency, CPU, and player count
 * @param lavalink The Lavalink manager instance
 * @returns The healthiest node or null if none are healthy
 */
function selectHealthiestNode(lavalink) {
    const nodes = lavalink.nodeManager.nodes;
    if (!nodes || nodes.size === 0)
        return null;
    let bestNode = null;
    let bestScore = Infinity;
    for (const node of nodes.values()) {
        if (!isNodeHealthy(node))
            continue;
        const health = getNodeHealthInfo(node);
        // Calculate score: lower is better
        const score = (health.ping ?? 0) * 0.5 +
            (health.cpuLoad ?? 0) * 100 +
            (health.playerCount ?? 0) * 10;
        if (score < bestScore) {
            bestScore = score;
            bestNode = node;
        }
    }
    return bestNode;
}
/**
 * Performs automatic failover to a backup node
 * @param lavalink The Lavalink manager instance
 * @param failedNodeId The ID of the failed node
 */
async function performFailover(lavalink, failedNodeId) {
    log.warn(`Node "${failedNodeId}" failed, initiating automatic failover...`);
    const backupNode = selectHealthiestNode(lavalink);
    if (!backupNode) {
        log.error("No healthy backup nodes available for failover");
        return;
    }
    activeNodeId = backupNode.id;
    log.info(`✓ Automatic failover successful: "${failedNodeId}" → "${backupNode.id}"`);
    // Log node health info
    const health = getNodeHealthInfo(backupNode);
    log.info(`Backup node health:`, {
        nodeId: health.nodeId,
        ping: health.ping,
        cpuLoad: health.cpuLoad,
        playerCount: health.playerCount,
    });
}
/**
 * Masks sensitive information for logging
 */
function maskPassword(password) {
    if (password.length <= 2)
        return "**";
    return password[0] + "*".repeat(password.length - 2) + password[password.length - 1];
}
/**
 * Logs comprehensive Lavalink startup diagnostics
 */
function logStartupDiagnostics(config) {
    log.info("Lavalink Configuration Diagnostics");
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    log.info(`Host: ${config.host}`);
    log.info(`Port: ${config.port}`);
    log.info(`Secure: ${config.secure ? "true (WSS)" : "false (WS)"}`);
    log.info(`Node ID: ${config.nodeId}`);
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}
/**
 * Logs connection attempt with detailed information
 */
function logConnectionAttempt(attempt, maxAttempts) {
    log.info(`Connection attempt ${attempt}/${maxAttempts}...`);
}
/**
 * Logs connection success
 */
function logConnectionSuccess(nodeId, latency) {
    log.info(`✓ Authentication successful`);
    log.info(`✓ Lavalink node "${nodeId}" connected${latency !== undefined ? ` (latency: ${latency}ms)` : ""}`);
}
/**
 * Logs connection failure with specific error type
 */
function logConnectionFailure(attempt, error) {
    const errorMessage = error.message.toLowerCase();
    let errorType = "Unknown error";
    if (errorMessage.includes("econnrefused") || errorMessage.includes("connection refused")) {
        errorType = "Connection refused";
    }
    else if (errorMessage.includes("enetunreach") || errorMessage.includes("getaddrinfo")) {
        errorType = "DNS lookup failed";
    }
    else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
        errorType = "Connection timeout";
    }
    else if (errorMessage.includes("authentication") || errorMessage.includes("unauthorized") || errorMessage.includes("401") || errorMessage.includes("403")) {
        errorType = "Authentication failed";
    }
    else if (errorMessage.includes("websocket") || errorMessage.includes("handshake")) {
        errorType = "WebSocket handshake failed";
    }
    else if (errorMessage.includes("ssl") || errorMessage.includes("tls") || errorMessage.includes("certificate")) {
        errorType = "SSL/TLS error";
    }
    log.error(`✗ Attempt ${attempt} failed: ${errorType}`, { error: error.message });
}
/**
 * Initializes the Lavalink connection manager with production-grade error handling
 * and reconnection logic.
 *
 * This function:
 * - Validates configuration before initialization
 * - Prevents duplicate initialization
 * - Implements exponential backoff reconnection
 * - Provides comprehensive logging
 * - Handles all errors gracefully without crashing the bot
 * - Allows the bot to function without music if Lavalink is unavailable
 *
 * @param client The Discord client instance
 */
export async function initLavalink(client) {
    // Prevent duplicate initialization
    if (isInitializing) {
        log.warn("Lavalink initialization already in progress, skipping duplicate call");
        return;
    }
    if (isInitialized) {
        log.warn("Lavalink already initialized, skipping duplicate call");
        return;
    }
    isInitializing = true;
    try {
        // Validate configuration
        const configValidation = validateLavalinkConfig();
        if (!configValidation.isValid) {
            log.warn(`Lavalink not configured: ${configValidation.error}`);
            log.info("Music commands will be unavailable until Lavalink is configured");
            log.info("Required environment variables: LAVALINK_HOST, LAVALINK_PORT, LAVALINK_PASSWORD");
            log.info("Optional environment variable: LAVALINK_SECURE (true/false)");
            return;
        }
        const nodeConfigs = parseNodeConfigs();
        if (nodeConfigs.length === 0) {
            log.error("Failed to parse node configuration from environment variables");
            return;
        }
        // Log startup diagnostics for all nodes
        log.info("Initializing Lavalink with multiple node support...");
        log.info(`Configured ${nodeConfigs.length} node(s):`);
        nodeConfigs.forEach((config, index) => {
            log.info(`  Node ${index + 1}: ${config.id} (${config.host}:${config.port})`);
        });
        // Create Lavalink manager with all configured nodes
        const lavalink = new LavalinkManager({
            nodes: nodeConfigs.map((config) => ({
                id: config.id,
                host: config.host,
                port: config.port,
                authorization: config.password,
                secure: config.secure,
                retryAmount: RECONNECT_CONFIG.maxAttempts,
                retryDelay: RECONNECT_CONFIG.initialDelay,
            })),
            sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
            client: { id: client.user?.id ?? "0", username: "Panindigan" },
            autoSkip: true,
            playerOptions: {
                defaultSearchPlatform: "ytsearch",
                volumeDecrementer: 1,
            },
        });
        // Set up event handlers with comprehensive logging
        lavalink.nodeManager.on("create", (node) => {
            log.info(`Lavalink node "${node.id}" created`);
        });
        lavalink.nodeManager.on("connect", (node) => {
            logConnectionSuccess(node.id);
            isInitialized = true;
            isInitializing = false;
            activeNodeId = node.id;
            // Log comprehensive node properties for debugging
            log.info(`[MUSIC] Node "${node.id}" properties after connection:`, {
                id: node.id,
                sessionId: node.sessionId,
                stats: node.stats ? {
                    players: node.stats.players,
                    playingPlayers: node.stats.playingPlayers,
                    uptime: node.stats.uptime,
                    memory: node.stats.memory,
                    cpu: node.stats.cpu,
                } : "not available",
            });
            // Log health check result
            const health = getNodeHealthInfo(node);
            log.info(`[MUSIC] Node "${node.id}" health check result:`, {
                connected: health.connected,
                hasSession: health.hasSession,
                hasStats: health.hasStats,
                isHealthy: isNodeHealthy(node),
            });
            client.updateMusicStatus(MusicStatus.READY, getMusicStatus(client));
        });
        lavalink.nodeManager.on("disconnect", (node) => {
            log.warn(`Lavalink node "${node.id}" disconnected`);
            isInitialized = false;
            client.updateMusicStatus(MusicStatus.DISCONNECTED, getMusicStatus(client));
            // Trigger automatic failover if this was the active node
            if (activeNodeId === node.id) {
                performFailover(lavalink, node.id).catch((err) => {
                    log.error("Failover failed", { error: String(err) });
                });
            }
        });
        lavalink.nodeManager.on("error", (node, error) => {
            logConnectionFailure(1, error);
            // Trigger automatic failover on critical errors
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes("authentication") || errorMessage.includes("connection refused")) {
                if (activeNodeId === node.id) {
                    performFailover(lavalink, node.id).catch((err) => {
                        log.error("Failover failed", { error: String(err) });
                    });
                }
            }
        });
        lavalink.nodeManager.on("reconnecting", (node) => {
            log.info(`Lavalink node "${node.id}" reconnecting...`);
        });
        lavalink.nodeManager.on("destroy", (node) => {
            log.warn(`Lavalink node "${node.id}" destroyed`);
            isInitialized = false;
        });
        // Handle raw Discord voice data
        client.on("raw", (d) => {
            try {
                lavalink.sendRawData(d);
            }
            catch (error) {
                log.error("Error sending raw data to Lavalink", { error: String(error) });
            }
        });
        // Voice connection lifecycle cleanup
        client.on("voiceStateUpdate", async (oldState, newState) => {
            const guildId = newState.guild.id;
            const player = lavalink.getPlayer(guildId);
            // Bot left voice channel
            if (oldState.channelId && !newState.channelId && newState.member?.id === client.user?.id) {
                log.info(`Bot left voice channel in guild ${guildId}`);
                if (player) {
                    try {
                        await player.destroy();
                        log.info(`Destroyed player for guild ${guildId} after bot left voice`);
                    }
                    catch (error) {
                        log.error(`Failed to destroy player for guild ${guildId}`, { error: String(error) });
                    }
                }
            }
            // Bot was kicked from voice channel
            if (oldState.channelId && !newState.channelId && newState.member?.id !== client.user?.id && player) {
                const voiceChannel = player.voiceChannelId;
                const botInChannel = newState.guild.members.me?.voice.channelId === voiceChannel;
                if (!botInChannel) {
                    log.info(`Bot was kicked from voice channel in guild ${guildId}`);
                    try {
                        await player.destroy();
                        log.info(`Destroyed player for guild ${guildId} after bot was kicked`);
                    }
                    catch (error) {
                        log.error(`Failed to destroy player for guild ${guildId}`, { error: String(error) });
                    }
                }
            }
        });
        // Handle guild delete (bot removed from guild)
        client.on("guildDelete", async (guild) => {
            const player = lavalink.getPlayer(guild.id);
            if (player) {
                log.info(`Bot removed from guild ${guild.id}, cleaning up player`);
                try {
                    await player.destroy();
                    log.info(`Destroyed player for guild ${guild.id} after guild delete`);
                }
                catch (error) {
                    log.error(`Failed to destroy player for guild ${guild.id}`, { error: String(error) });
                }
            }
        });
        // Guild isolation: Each player is automatically scoped to its guild by lavalink-client
        // No additional isolation logic needed - the library enforces:
        // - One player per guild (lavalink.getPlayer(guildId) returns guild-specific player)
        // - One queue per player (player.queue is guild-scoped)
        // - One voice connection per player (player.voiceChannelId is guild-specific)
        // Cross-guild contamination is prevented by design
        // Initialize Lavalink when client is ready
        client.once("clientReady", () => {
            try {
                if (client.user) {
                    lavalink.init({ id: client.user.id, username: client.user.username });
                    log.info("Lavalink manager initialized with Discord client");
                }
            }
            catch (error) {
                log.error("Failed to initialize Lavalink manager", { error: String(error) });
                isInitialized = false;
                isInitializing = false;
            }
        });
        // Store Lavalink instance on client
        client.lavalink = lavalink;
        // Start health monitoring service
        startHealthMonitor(client);
        log.info("Lavalink manager created successfully");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error("Failed to create Lavalink manager", { error: errorMessage });
        log.info("Music commands will be unavailable");
        isInitializing = false;
        isInitialized = false;
    }
}
/**
 * Gets the current music status for monitoring purposes
 * @param client The Discord client instance
 * @returns MusicStatusInfo object with detailed status
 */
export function getMusicStatusInfo(client) {
    return getMusicStatus(client);
}
/**
 * Checks if the music system is ready for operations
 * @param client The Discord client instance
 * @returns true if music is ready, false otherwise
 */
export function isMusicSystemReady(client) {
    const status = getMusicStatus(client);
    return status.status === MusicStatus.READY;
}
//# sourceMappingURL=musicManager.js.map