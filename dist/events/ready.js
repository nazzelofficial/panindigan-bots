import { ActivityType } from "discord.js";
import { scopedLogger } from "../utils/logger";
const log = scopedLogger("ready");
const ACTIVITY_TYPE_MAP = {
    PLAYING: ActivityType.Playing,
    WATCHING: ActivityType.Watching,
    LISTENING: ActivityType.Listening,
    COMPETING: ActivityType.Competing,
    STREAMING: ActivityType.Streaming,
};
function startPresenceRotation(client) {
    const { presence } = client.config.bot;
    if (!presence.rotate || !presence.activities?.length)
        return;
    let index = 0;
    const apply = () => {
        const activity = presence.activities[index % presence.activities.length];
        client.user?.setPresence({
            activities: [{ name: activity.text, type: ACTIVITY_TYPE_MAP[activity.type] ?? ActivityType.Playing }],
            status: "online",
        });
        index++;
    };
    apply();
    setInterval(apply, Math.max(10, presence.rotateIntervalSeconds) * 1000);
}
const event = {
    name: "clientReady",
    once: true,
    async execute(client) {
        const userTag = client.user?.tag;
        log.info(`Logged in as ${userTag ?? "unknown"}`, {
            guilds: client.guilds?.cache.size ?? 0,
            commands: client.commands.size,
        });
        startPresenceRotation(client);
    },
};
export default event;
function setInterval(apply, arg1) {
    return globalThis.setInterval(apply, arg1);
}
//# sourceMappingURL=ready.js.map