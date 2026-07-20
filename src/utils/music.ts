import type { LavalinkManager } from "lavalink-client";
import type { PanindiganClient } from "../structures/Client.js";

/**
 * Music system status enum for tracking Lavalink availability
 */
export enum MusicStatus {
  /** Music is not configured (missing env vars) */
  NOT_CONFIGURED = "NOT_CONFIGURED",
  /** Music is configured but no nodes are registered */
  NO_NODES = "NO_NODES",
  /** Nodes exist but none are connected */
  DISCONNECTED = "DISCONNECTED",
  /** At least one node is connected and ready */
  READY = "READY",
  /** Connection failed with specific error */
  CONNECTION_FAILED = "CONNECTION_FAILED",
}

/**
 * Detailed information about music system status
 */
export interface MusicStatusInfo {
  status: MusicStatus;
  message: string;
  nodeCount?: number;
  connectedNodeCount?: number;
  error?: string;
}

/**
 * Validates Lavalink configuration from environment variables
 * @returns Object with isValid flag and error message if invalid
 */
export function validateLavalinkConfig(): { isValid: boolean; error?: string } {
  const host = process.env.LAVALINK_HOST;
  const port = process.env.LAVALINK_PORT;
  const password = process.env.LAVALINK_PASSWORD;
  const secure = process.env.LAVALINK_SECURE;

  // Check if all required fields are present
  if (!host || !port || !password) {
    const missing: string[] = [];
    if (!host) missing.push("LAVALINK_HOST");
    if (!port) missing.push("LAVALINK_PORT");
    if (!password) missing.push("LAVALINK_PASSWORD");
    return {
      isValid: false,
      error: `Missing required Lavalink configuration: ${missing.join(", ")}`,
    };
  }

  // Validate host format
  if (typeof host !== "string" || host.trim().length === 0) {
    return { isValid: false, error: "LAVALINK_HOST must be a non-empty string" };
  }

  // Validate port
  const portNum = Number(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { isValid: false, error: "LAVALINK_PORT must be a valid port number (1-65535)" };
  }

  // Validate password
  if (typeof password !== "string" || password.trim().length === 0) {
    return { isValid: false, error: "LAVALINK_PASSWORD must be a non-empty string" };
  }

  // Validate secure flag if provided
  if (secure !== undefined && secure !== "true" && secure !== "false") {
    return { isValid: false, error: "LAVALINK_SECURE must be 'true' or 'false'" };
  }

  return { isValid: true };
}

/**
 * Gets the current status of the Lavalink music system
 * @param client The Discord client instance
 * @returns MusicStatusInfo object with detailed status
 */
export function getMusicStatus(client: PanindiganClient): MusicStatusInfo {
  const lavalink = client.lavalink;

  // Check if Lavalink is configured
  const configValidation = validateLavalinkConfig();
  if (!configValidation.isValid) {
    return {
      status: MusicStatus.NOT_CONFIGURED,
      message: configValidation.error!,
    };
  }

  // Check if Lavalink manager exists
  if (!lavalink) {
    return {
      status: MusicStatus.NO_NODES,
      message: "Lavalink manager not initialized",
    };
  }

  // Check if nodes exist
  const nodeManager = lavalink.nodeManager;
  const nodes = nodeManager?.nodes;
  const nodeCount = nodes?.size ?? 0;

  if (nodeCount === 0) {
    return {
      status: MusicStatus.NO_NODES,
      message: "No Lavalink nodes registered",
      nodeCount: 0,
    };
  }

  // Check if any nodes are connected
  let connectedCount = 0;
  nodes?.forEach((node) => {
    // Check if node is connected by checking if it's online
    if ((node as any).connected === true || (node as any).state === "connected") {
      connectedCount++;
    }
  });

  if (connectedCount === 0) {
    return {
      status: MusicStatus.DISCONNECTED,
      message: "No Lavalink nodes are currently connected",
      nodeCount,
      connectedNodeCount: 0,
    };
  }

  // At least one node is connected
  return {
    status: MusicStatus.READY,
    message: "Lavalink is ready",
    nodeCount,
    connectedNodeCount: connectedCount,
  };
}

/**
 * Checks if the music system is ready for operations
 * @param client The Discord client instance
 * @returns true if music is ready, false otherwise
 */
export function isMusicReady(client: PanindiganClient): boolean {
  const status = getMusicStatus(client);
  return status.status === MusicStatus.READY;
}

/**
 * Gets a user-friendly error message for when music is unavailable
 * @param client The Discord client instance
 * @returns User-friendly error message
 */
export function getMusicUnavailableMessage(client: PanindiganClient): string {
  const status = getMusicStatus(client);

  switch (status.status) {
    case MusicStatus.NOT_CONFIGURED:
      return "❌ Music service is currently unavailable.\nLavalink is not configured. Contact the bot administrator.";
    case MusicStatus.NO_NODES:
      return "❌ Music service is currently unavailable.\nNo Lavalink nodes are registered. Contact the bot administrator.";
    case MusicStatus.DISCONNECTED:
      return "❌ Music service is currently unavailable.\nThe Lavalink server is offline or unreachable. Please try again later.";
    case MusicStatus.CONNECTION_FAILED:
      return `❌ Music service is currently unavailable.\n${status.message}`;
    default:
      return "❌ Music service is currently unavailable.\nPlease try again later.";
  }
}

/**
 * Detailed node health information
 */
export interface NodeHealthInfo {
  nodeId: string;
  connected: boolean;
  ready: boolean;
  websocketOpen: boolean;
  authenticated: boolean;
  ping?: number;
  playerCount?: number;
  memoryUsage?: number;
  cpuLoad?: number;
  debugReason?: string; // Debug info for why node is unhealthy
}

/**
 * Gets detailed health information for a specific node
 * @param node The Lavalink node
 * @returns NodeHealthInfo object
 */
export function getNodeHealthInfo(node: any): NodeHealthInfo {
  const stats = node?.stats;
  const state = node?.state;
  const sessionId = node?.sessionId;
  const wsReadyState = node?.ws?.readyState;

  // In lavalink-client v2.x, the main indicator is the 'state' property
  // Valid states: 'connected', 'connecting', 'disconnected', 'error'
  const isConnected = state === "connected";
  const hasSession = !!sessionId;
  const wsOpen = wsReadyState === 1; // WebSocket.OPEN

  const healthInfo: NodeHealthInfo = {
    nodeId: node.id,
    connected: isConnected,
    ready: isConnected && hasSession,
    websocketOpen: wsOpen,
    authenticated: isConnected && hasSession,
    ping: stats?.ping ?? undefined,
    playerCount: stats?.players ?? undefined,
    memoryUsage: stats?.memory?.used ?? undefined,
    cpuLoad: stats?.cpu?.lavalinkLoad ?? undefined,
  };

  // Add debug reason if unhealthy
  if (!isConnected) {
    healthInfo.debugReason = `State is "${state}" (expected "connected")`;
  } else if (!hasSession) {
    healthInfo.debugReason = `No session ID (sessionId: ${sessionId})`;
  } else if (!wsOpen) {
    healthInfo.debugReason = `WebSocket not open (readyState: ${wsReadyState})`;
  }

  return healthInfo;
}

/**
 * Validates if a node is healthy and ready for operations
 * @param node The Lavalink node
 * @returns true if node is healthy, false otherwise
 */
export function isNodeHealthy(node: any): boolean {
  const health = getNodeHealthInfo(node);
  const isHealthy = health.connected && health.ready && health.authenticated;

  // Debug log if unhealthy
  if (!isHealthy) {
    console.log(`[MUSIC DEBUG] Node "${health.nodeId}" is unhealthy:`, {
      connected: health.connected,
      ready: health.ready,
      authenticated: health.authenticated,
      websocketOpen: health.websocketOpen,
      reason: health.debugReason,
      state: node?.state,
      sessionId: node?.sessionId,
      wsReadyState: node?.ws?.readyState,
    });
  }

  return isHealthy;
}

/**
 * Gets a healthy Lavalink node if one exists
 * @param client The Discord client instance
 * @returns A healthy node or null if none are available
 */
export function getHealthyNode(client: PanindiganClient): ReturnType<LavalinkManager["nodeManager"]["nodes"]["get"]> | null {
  const lavalink = client.lavalink;
  if (!lavalink?.nodeManager?.nodes) {
    console.log("[MUSIC DEBUG] getHealthyNode: Lavalink or nodeManager not available");
    return null;
  }

  const nodes = Array.from(lavalink.nodeManager.nodes.values());
  console.log(`[MUSIC DEBUG] getHealthyNode: Checking ${nodes.length} node(s)`);

  // Find the first healthy node
  for (const node of nodes) {
    const health = getNodeHealthInfo(node);
    console.log(`[MUSIC DEBUG] Checking node "${health.nodeId}":`, {
      connected: health.connected,
      ready: health.ready,
      authenticated: health.authenticated,
      websocketOpen: health.websocketOpen,
      reason: health.debugReason,
    });

    if (isNodeHealthy(node)) {
      console.log(`[MUSIC DEBUG] ✓ Found healthy node: "${health.nodeId}"`);
      return node;
    }
  }

  console.log("[MUSIC DEBUG] ✗ No healthy nodes found");
  return null;
}

/**
 * Gets a connected Lavalink node if one exists
 * @param client The Discord client instance
 * @returns A connected node or null if none are available
 * @deprecated Use getHealthyNode instead for comprehensive validation
 */
export function getConnectedNode(client: PanindiganClient): ReturnType<LavalinkManager["nodeManager"]["nodes"]["get"]> | null {
  return getHealthyNode(client);
}

/**
 * Validates that a music operation can proceed with comprehensive node health checks
 * Returns an error message if validation fails, null if validation passes
 * @param client The Discord client instance
 * @returns Error message or null if valid
 */
export function validateMusicOperation(client: PanindiganClient): string | null {
  console.log("[MUSIC DEBUG] validateMusicOperation called");

  const status = getMusicStatus(client);
  console.log("[MUSIC DEBUG] Music status:", status);

  if (status.status !== MusicStatus.READY) {
    console.log("[MUSIC DEBUG] Music status not READY, returning error");
    return getMusicUnavailableMessage(client);
  }

  // Additional node health validation
  const healthyNode = getHealthyNode(client);
  if (!healthyNode) {
    console.log("[MUSIC DEBUG] No healthy node found, returning error");
    return "❌ Music service is currently unavailable.\nNo Lavalink node is currently ready.\nPlease try again later.";
  }

  console.log("[MUSIC DEBUG] ✓ Validation passed, healthy node found");
  return null;
}

/**
 * Gets detailed health information for all nodes
 * @param client The Discord client instance
 * @returns Array of NodeHealthInfo objects
 */
export function getAllNodesHealthInfo(client: PanindiganClient): NodeHealthInfo[] {
  const lavalink = client.lavalink;
  if (!lavalink?.nodeManager?.nodes) {
    return [];
  }

  const healthInfos: NodeHealthInfo[] = [];
  for (const node of lavalink.nodeManager.nodes.values()) {
    healthInfos.push(getNodeHealthInfo(node));
  }

  return healthInfos;
}
