import { scopedLogger } from "../../utils/logger.js";
import { isNodeHealthy, getAllNodesHealthInfo } from "../../utils/music.js";
const log = scopedLogger("music-health");
/**
 * Health monitoring configuration
 */
const HEALTH_MONITOR_CONFIG = {
    intervalMs: 30000, // 30 seconds
    unhealthyThreshold: 3, // Number of consecutive failures before marking as unhealthy
    recoveryThreshold: 2, // Number of consecutive successes before marking as recovered
};
/**
 * Health monitor state
 */
let healthMonitorInterval = null;
let isMonitoring = false;
const nodeHealthTracking = new Map();
/**
 * Starts the health monitoring background service
 * @param client The Discord client instance
 */
export function startHealthMonitor(client) {
    if (isMonitoring) {
        log.warn("Health monitor already running, skipping duplicate start");
        return;
    }
    if (!client.lavalink) {
        log.warn("Cannot start health monitor: Lavalink not initialized");
        return;
    }
    isMonitoring = true;
    log.info("Starting Lavalink health monitoring service...");
    log.info(`Health check interval: ${HEALTH_MONITOR_CONFIG.intervalMs}ms`);
    // Run initial health check
    performHealthCheck(client);
    // Start periodic health checks
    healthMonitorInterval = setInterval(() => {
        performHealthCheck(client);
    }, HEALTH_MONITOR_CONFIG.intervalMs);
    log.info("Health monitoring service started");
}
/**
 * Stops the health monitoring background service
 */
export function stopHealthMonitor() {
    if (!isMonitoring) {
        return;
    }
    if (healthMonitorInterval) {
        clearInterval(healthMonitorInterval);
        healthMonitorInterval = null;
    }
    isMonitoring = false;
    nodeHealthTracking.clear();
    log.info("Health monitoring service stopped");
}
/**
 * Performs a comprehensive health check on all nodes
 * @param client The Discord client instance
 */
function performHealthCheck(client) {
    if (!client.lavalink) {
        return;
    }
    const nodes = client.lavalink.nodeManager.nodes;
    if (!nodes || nodes.size === 0) {
        return;
    }
    const healthInfos = getAllNodesHealthInfo(client);
    const now = Date.now();
    for (const health of healthInfos) {
        const tracking = nodeHealthTracking.get(health.nodeId) || {
            nodeId: health.nodeId,
            consecutiveFailures: 0,
            consecutiveSuccesses: 0,
            isMarkedUnhealthy: false,
            lastCheckTime: 0,
        };
        tracking.lastCheckTime = now;
        if (isNodeHealthy(nodes.get(health.nodeId))) {
            // Node is healthy
            tracking.consecutiveSuccesses++;
            tracking.consecutiveFailures = 0;
            // Check if node has recovered
            if (tracking.isMarkedUnhealthy && tracking.consecutiveSuccesses >= HEALTH_MONITOR_CONFIG.recoveryThreshold) {
                tracking.isMarkedUnhealthy = false;
                log.info(`✓ Node "${health.nodeId}" has recovered and is now healthy`);
                logStructuredNodeHealth(health);
            }
            // Log health info periodically (every 5 minutes)
            if (tracking.consecutiveSuccesses % 10 === 0) {
                logStructuredNodeHealth(health);
            }
        }
        else {
            // Node is unhealthy
            tracking.consecutiveFailures++;
            tracking.consecutiveSuccesses = 0;
            // Check if node should be marked as unhealthy
            if (!tracking.isMarkedUnhealthy && tracking.consecutiveFailures >= HEALTH_MONITOR_CONFIG.unhealthyThreshold) {
                tracking.isMarkedUnhealthy = true;
                log.warn(`✗ Node "${health.nodeId}" marked as unhealthy after ${tracking.consecutiveFailures} consecutive failures`);
                logStructuredNodeHealth(health);
            }
        }
        nodeHealthTracking.set(health.nodeId, tracking);
    }
}
/**
 * Logs structured node health information
 * @param health The node health info
 */
function logStructuredNodeHealth(health) {
    log.info(`[MUSIC] Node Health: ${health.nodeId}`, {
        status: health.connected ? "Connected" : "Disconnected",
        hasSession: health.hasSession ? "Yes" : "No",
        hasStats: health.hasStats ? "Yes" : "No",
        ping: health.ping ? `${health.ping}ms` : "N/A",
        players: health.playerCount ?? 0,
        memory: health.memoryUsage ? `${Math.round(health.memoryUsage / 1024 / 1024)}MB` : "N/A",
        cpu: health.cpuLoad ? `${Math.round(health.cpuLoad * 100)}%` : "N/A",
    });
}
/**
 * Gets the current health monitoring status
 * @returns Object with monitoring status and node health tracking
 */
export function getHealthMonitorStatus() {
    const nodeTrackingObj = {};
    nodeHealthTracking.forEach((tracking, nodeId) => {
        nodeTrackingObj[nodeId] = tracking;
    });
    return {
        isMonitoring,
        intervalMs: HEALTH_MONITOR_CONFIG.intervalMs,
        nodeTracking: nodeTrackingObj,
    };
}
/**
 * Gets health tracking for a specific node
 * @param nodeId The node ID
 * @returns Node health tracking or null if not found
 */
export function getNodeHealthTracking(nodeId) {
    return nodeHealthTracking.get(nodeId) || null;
}
//# sourceMappingURL=healthMonitor.js.map