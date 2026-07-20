import { LavalinkManager } from "lavalink-client";
import { scopedLogger } from "../../utils/logger.js";
const log = scopedLogger("music");
/**
 * Initializes the Lavalink connection manager if Lavalink credentials are
 * present in the environment. Music commands check `client.lavalink` and
 * fail gracefully (not silently) with an explicit "music isn't configured"
 * message when it's null — no fake playback.
 */
export function initLavalink(client) {
    const host = process.env.LAVALINK_HOST;
    const port = process.env.LAVALINK_PORT;
    const password = process.env.LAVALINK_PASSWORD;
    if (!host || !port || !password) {
        log.warn("Lavalink credentials not set — music commands will be unavailable until LAVALINK_HOST/PORT/PASSWORD are configured");
        return;
    }
    client.lavalink = new LavalinkManager({
        nodes: [
            {
                id: "main",
                host,
                port: Number(port),
                authorization: password,
                secure: process.env.LAVALINK_SECURE === "true",
            },
        ],
        sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
        client: { id: client.user?.id ?? "0", username: "Panindigan" },
        autoSkip: true,
        playerOptions: {
            defaultSearchPlatform: "ytsearch",
            volumeDecrementer: 1,
        },
    });
    client.lavalink.nodeManager.on("connect", (node) => log.info(`Lavalink node "${node.id}" connected`));
    client.lavalink.nodeManager.on("error", (node, error) => log.error(`Lavalink node "${node.id}" error`, { error: String(error) }));
    client.lavalink.nodeManager.on("disconnect", (node) => log.warn(`Lavalink node "${node.id}" disconnected`));
    client.on("raw", (d) => client.lavalink?.sendRawData(d));
    client.once("clientReady", () => client.lavalink?.init({ id: client.user.id, username: client.user.username }));
}
//# sourceMappingURL=musicManager.js.map