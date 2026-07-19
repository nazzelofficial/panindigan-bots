import type {
  ChatInputCommandInteraction,
  Message,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import type { PanindiganClient } from "./Client";

export type AccessTier = "owner" | "coowner" | "admin" | "moderator" | "general";

export interface RunContext {
  client: PanindiganClient;
  guildId: string | null;
  userId: string;
  isSlash: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reply: (payload: any) => Promise<any>;
  args: string[];
  interaction?: ChatInputCommandInteraction;
  message?: Message;
  /** True when the invoking user is a bot owner. */
  isOwner(): boolean;
  /** True when the invoking guild has active premium. Async — awaits DB. */
  isPremium(): Promise<boolean>;
  /**
   * Heuristic: returns true when the invoking slash interaction originated
   * from a mobile client (Discord mobile). Always false for prefix commands.
   */
  isMobileUser(): boolean;
  /**
   * Returns the remaining cooldown seconds for a named cooldown key, or null
   * if the user is not on cooldown. Uses the client's built-in cooldown store.
   */
  hasCooldown(commandName: string): number | null;
}

export interface ReplyPayload {
  content?: string;
  embeds?: unknown[];
  components?: unknown[];
  files?: unknown[];
  ephemeral?: boolean;
  allowedMentions?: unknown;
  fetchReply?: boolean;
  [key: string]: unknown;
}

export type SlashBuilder =
  | SlashCommandBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export interface CommandDefinition {
  /** Primary command name, lowercase, no spaces — used for both `/name` and `prefix name`. */
  name: string;
  description: string;
  category: string;
  /** Minimum access tier required to run this command. */
  access: AccessTier;
  /** Marks a command as Premium-only (⭐ in the docs). */
  premium?: boolean;
  /** Discord permission(s) additionally required of the invoking member (server-level gate). */
  memberPermissions?: PermissionResolvable[];
  /** Discord permission(s) required of the bot itself to execute this action. */
  botPermissions?: PermissionResolvable[];
  /** Per-user cooldown in seconds. */
  cooldown?: number;
  /** Whether this command may only be used inside a guild. */
  guildOnly?: boolean;
  /** Builds the slash command data (without name/description, those are set automatically). */
  slashData?: (builder: SlashCommandBuilder) => SlashBuilder;
  /** Aliases usable with the prefix invocation. */
  aliases?: string[];
  /** Actual command logic. */
  execute: (ctx: RunContext) => Promise<unknown>;
  /** Optional autocomplete handler for slash command options. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autocomplete?: (interaction: any, client: PanindiganClient) => Promise<void>;
  /**
   * Optional one-time hook called at startup after all commands are loaded.
   * Register handlers on `client.componentHandlers` keyed by customId prefix.
   */
  registerComponents?: (client: PanindiganClient) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EventDefinition<T extends any[] = any[]> {
  name: string;
  once?: boolean;
  execute: (client: PanindiganClient, ...args: T) => Promise<unknown> | unknown;
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export interface MonitoringStats {
  heapUsedMB:    number;
  heapTotalMB:   number;
  wsPingMs:      number;
  dbConnected:   boolean;
  uptimeSeconds: number;
  guildCount:    number;
  userCount:     number;
  channelCount:  number;
  messageCache:  number;
  shardCount:    number;
}

// ── Startup ───────────────────────────────────────────────────────────────────

export interface StartupPhaseResult {
  phase: string;
  success: boolean;
  durationMs: number;
  detail?: string;
}

export interface StartupResult {
  phases: StartupPhaseResult[];
  totalDurationMs: number;
  commandsLoaded: number;
  eventsLoaded: number;
  ok: boolean;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── Cache ─────────────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  key: string;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

export interface RateLimitEntry {
  userId: string;
  hits: number;
  windowStart: number;
}

// ── Component interactions ────────────────────────────────────────────────────

export interface ComponentInteractionContext {
  customId: string;
  /** The first segment of the customId (before ":"). */
  prefix: string;
  /** All segments split by ":". */
  parts: string[];
  userId: string;
  guildId: string | null;
}
