import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import type { CommandDefinition, EventDefinition } from "./types.js";
import { config } from "../config/config.js";
import { scopedLogger } from "../utils/logger.js";
import type { LavalinkManager } from "lavalink-client";

const log = scopedLogger("client");

export class PanindiganClient extends Client {
  public commands = new Collection<string, CommandDefinition>();
  public aliases = new Collection<string, string>();
  public cooldowns = new Collection<string, Collection<string, number>>();
  public events = new Collection<string, EventDefinition>();
  public lavalink: LavalinkManager | null = null;
  public config = config;
  public startedAt = Date.now();
  /** customId prefix (before the first ":") -> handler, for buttons/selects/modals. */
  public componentHandlers = new Collection<string, (interaction: any) => Promise<void>>();

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

  isOnCooldown(commandName: string, userId: string, seconds: number): number | null {
    if (!seconds) return null;
    const bucket = this.cooldowns.get(commandName) ?? new Collection<string, number>();
    this.cooldowns.set(commandName, bucket);
    const expiresAt = bucket.get(userId);
    const now = Date.now();
    if (expiresAt && expiresAt > now) {
      return Math.ceil((expiresAt - now) / 1000);
    }
    bucket.set(userId, now + seconds * 1000);
    return null;
  }

  log = log;
}
