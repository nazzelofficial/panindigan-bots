import { dispatchCommand } from "../handlers/commandHandler";
import { GuildModel } from "../database/models/Guild";
import { UserModel } from "../database/models/User";
import { grantMessageXp } from "../features/leveling/xpEngine";
import { runAutomodChecks } from "../features/automod/automodEngine";
import { isBotOwner } from "../utils/permissions";
import { isGuildPremium } from "../utils/premium";
import { scopedLogger } from "../utils/logger";
import { botCache, CACHE_TTL } from "../utils/cache";
const log = scopedLogger("message");
/** Remove flags unsupported by plain message replies (e.g. ephemeral). */
function sanitizeForMessage(payload) {
    const { ephemeral: _ephemeral, ...rest } = payload;
    return rest;
}
async function getGuildPrefix(client, guildId) {
    const cacheKey = `prefix:${guildId}`;
    const cached = botCache.get(cacheKey);
    if (cached !== undefined)
        return cached;
    const guildConfig = await GuildModel.findOne({ guildId }, { prefix: 1 }).lean();
    const prefix = guildConfig?.prefix ?? client.config.bot.defaultPrefix;
    botCache.set(cacheKey, prefix, CACHE_TTL.GUILD_CONFIG);
    return prefix;
}
async function handlePrefixCommand(client, message, prefix) {
    const withoutPrefix = message.content.slice(prefix.length).trim();
    const [rawName, ...args] = withoutPrefix.split(/\s+/);
    const name = rawName?.toLowerCase();
    if (!name)
        return;
    const command = client.commands.get(name) ?? client.commands.get(client.aliases.get(name) ?? "");
    if (!command)
        return;
    const ctx = {
        client,
        guildId: message.guildId,
        userId: message.author.id,
        isSlash: false,
        message,
        args,
        isOwner: () => isBotOwner(message.author.id),
        isPremium: async () => message.guildId ? isGuildPremium(message.guildId) : false,
        isMobileUser: () => false, // prefix commands can't detect client type
        hasCooldown: (commandName) => client.isOnCooldown(commandName, message.author.id, 0),
        reply: async (payload) => message.reply(sanitizeForMessage(payload)),
    };
    await dispatchCommand(client, command, ctx, message.member);
}
const event = {
    name: "messageCreate",
    async execute(client, message) {
        if (message.author.bot || !message.content)
            return;
        try {
            if (message.guildId) {
                await UserModel.findOneAndUpdate({ userId: message.author.id }, {}, { upsert: true }).catch(() => null);
                await grantMessageXp(client, message).catch((err) => log.error("XP grant failed", { error: err.message }));
                const blocked = await runAutomodChecks(client, message).catch((err) => {
                    log.error("Automod check failed", { error: err.message });
                    return false;
                });
                if (blocked)
                    return;
            }
            let prefix = client.config.bot.defaultPrefix;
            if (message.guildId) {
                prefix = await getGuildPrefix(client, message.guildId);
            }
            const mentionMatch = message.content.match(new RegExp(`^<@!?${client.user?.id}>\\s*`));
            const effectivePrefix = mentionMatch ? mentionMatch[0] : prefix;
            if (!message.content.startsWith(effectivePrefix))
                return;
            await handlePrefixCommand(client, message, effectivePrefix);
        }
        catch (err) {
            const message_ = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            log.error("Unhandled messageCreate error", { error: message_, stack });
        }
    },
};
export default event;
//# sourceMappingURL=messageCreate.js.map