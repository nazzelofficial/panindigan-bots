import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { config } from "../config/config.js";
import { scopedLogger } from "../utils/logger.js";
import { MusicStatus } from "../utils/music.js";
const log = scopedLogger("client");
export class PanindiganClient extends Client {
    commands = new Collection();
    aliases = new Collection();
    cooldowns = new Collection();
    events = new Collection();
    lavalink = null;
    config = config;
    startedAt = Date.now();
    /** customId prefix (before the first ":") -> handler, for buttons/selects/modals. */
    componentHandlers = new Collection();
    /** Music system status tracking */
    musicStatus = MusicStatus.NOT_CONFIGURED;
    musicStatusInfo = null;
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
                GatewayIntentBits.GuildEmojisAndStickers,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
            allowedMentions: { parse: ["users", "roles"], repliedUser: true },
        });
    }
    isOnCooldown(commandName, userId, seconds) {
        if (!seconds)
            return null;
        const bucket = this.cooldowns.get(commandName) ?? new Collection();
        this.cooldowns.set(commandName, bucket);
        const expiresAt = bucket.get(userId);
        const now = Date.now();
        if (expiresAt && expiresAt > now) {
            return Math.ceil((expiresAt - now) / 1000);
        }
        bucket.set(userId, now + seconds * 1000);
        return null;
    }
    /**
     * Updates the music system status
     * @param status The new music status
     * @param info Optional detailed status information
     */
    updateMusicStatus(status, info) {
        this.musicStatus = status;
        if (info) {
            this.musicStatusInfo = info;
        }
    }
    /**
     * Checks if the music system is ready for operations
     * @returns true if music is ready, false otherwise
     */
    isMusicReady() {
        return this.musicStatus === MusicStatus.READY;
    }
    log = log;
}
//# sourceMappingURL=Client.js.map