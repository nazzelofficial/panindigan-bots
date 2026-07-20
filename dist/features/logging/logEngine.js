import { GuildModel } from "../../database/models/Guild.js";
import { getClientInstance } from "../../structures/clientRegistry.js";
/**
 * Sends a log embed to whichever channel the guild has configured for the
 * given event key (e.g. "ban", "messageDelete", "roleUpdate"). No-ops
 * silently if logging is disabled, the event is toggled off, or no channel
 * is configured — logging is opt-in per event.
 */
export async function sendLogEvent(guildId, eventKey, buildEmbed) {
    const config = await GuildModel.findOne({ guildId }).lean();
    if (!config?.logging?.enabled)
        return;
    if (config.logging.disabledEvents?.includes(eventKey))
        return;
    const channelId = config.logging.channels?.[eventKey] ?? config.logging.channels?.get?.(eventKey);
    if (!channelId)
        return;
    const client = getClientInstance();
    const guild = client?.guilds.cache.get(guildId);
    const channel = guild?.channels.cache.get(channelId);
    if (channel?.isTextBased()) {
        await channel.send({ embeds: [buildEmbed()] }).catch(() => { });
    }
}
//# sourceMappingURL=logEngine.js.map