/**
 * types/dtos.ts v0.2.6
 * Data Transfer Objects — typed shapes for cross-layer data passing.
 * These are pure data contracts: no logic, no Discord.js imports.
 */

// ── Guild ─────────────────────────────────────────────────────────────────────

export interface GuildConfigDTO {
  guildId:           string;
  prefix:            string;
  language:          "en" | "fil";
  premiumTier:       0 | 1 | 2 | 3 | 4;
  adminRoleIds:      string[];
  modRoleIds:        string[];
  muteRoleId:        string | null;
  logChannelId:      string | null;
  welcomeChannelId:  string | null;
  goodbyeChannelId:  string | null;
  updatedAt:         Date;
}

export interface GuildStatsDTO {
  guildId:      string;
  memberCount:  number;
  botCount:     number;
  channelCount: number;
  roleCount:    number;
  boostLevel:   number;
  boostCount:   number;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserProfileDTO {
  userId:       string;
  guildId:      string;
  xp:           number;
  level:        number;
  rank:         number;
  balance:      number;
  bank:         number;
  totalMessages: number;
  joinedAt:     Date;
}

export interface UserEconomyDTO {
  userId:        string;
  guildId:       string;
  balance:       number;
  bank:          number;
  lastDaily:     Date | null;
  lastWork:      Date | null;
  lastCrime:     Date | null;
  inventory:     InventoryItemDTO[];
}

export interface InventoryItemDTO {
  itemId:    string;
  name:      string;
  quantity:  number;
  value:     number;
}

// ── Leveling ──────────────────────────────────────────────────────────────────

export interface LevelingEntryDTO {
  userId:   string;
  guildId:  string;
  xp:       number;
  level:    number;
  rank:     number;
}

export interface LeaderboardEntryDTO extends LevelingEntryDTO {
  username: string;
  avatar:   string | null;
}

// ── Moderation ────────────────────────────────────────────────────────────────

export interface ModerationCaseDTO {
  caseId:       number;
  guildId:      string;
  userId:       string;
  moderatorId:  string;
  action:       ModerationAction;
  reason:       string;
  duration:     number | null;   // ms, null = permanent
  active:       boolean;
  createdAt:    Date;
  expiresAt:    Date | null;
}

export type ModerationAction = "warn" | "mute" | "kick" | "ban" | "tempban" | "timeout" | "unban" | "unmute";

// ── Music ─────────────────────────────────────────────────────────────────────

export interface TrackDTO {
  identifier:  string;
  title:       string;
  author:      string;
  duration:    number;   // ms
  uri:         string;
  thumbnailUrl: string | null;
  isStream:    boolean;
  requester:   RequestedByDTO;
}

export interface RequestedByDTO {
  userId:   string;
  username: string;
  avatar:   string | null;
}

export interface QueueDTO {
  guildId:     string;
  tracks:      TrackDTO[];
  currentIdx:  number;
  isPlaying:   boolean;
  isPaused:    boolean;
  volume:      number;
  loopMode:    "none" | "track" | "queue";
  shuffle:     boolean;
}

// ── Giveaway ──────────────────────────────────────────────────────────────────

export interface GiveawayDTO {
  giveawayId:   string;
  guildId:      string;
  channelId:    string;
  messageId:    string;
  hostId:       string;
  prize:        string;
  winnerCount:  number;
  endsAt:       Date;
  ended:        boolean;
  entries:      string[];
  winners:      string[];
  bonusEntries: BonusEntryDTO[];
}

export interface BonusEntryDTO {
  roleId:  string;
  entries: number;
}

// ── Ticket ────────────────────────────────────────────────────────────────────

export interface TicketDTO {
  ticketId:    string;
  guildId:     string;
  channelId:   string;
  userId:      string;
  panelId:     string;
  subject:     string;
  status:      "open" | "closed" | "on-hold";
  assignedTo:  string | null;
  createdAt:   Date;
  closedAt:    Date | null;
}

// ── Scheduler ────────────────────────────────────────────────────────────────

export interface ScheduledMessageDTO {
  jobId:       string;
  guildId:     string;
  channelId:   string;
  content:     string;
  scheduleAt:  Date;
  recurring:   boolean;
  cronExpr:    string | null;
  lastRun:     Date | null;
}

// ── Command telemetry ─────────────────────────────────────────────────────────

export interface CommandTelemetryDTO {
  timestamp:          string;
  level:              "info" | "warn" | "error";
  category:           "COMMAND";
  guild_id?:          string;
  user_id:            string;
  shard_id?:          number;
  command:            string;
  execution_time_ms:  number;
  db_latency_ms?:     number;
  api_latency_ms?:    number;
  voice_latency_ms?:  number;
  memory_mb:          number;
  cpu_percent?:       number;
  success:            boolean;
  error?:             string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationStateDTO<T = unknown> {
  items:        T[];
  currentPage:  number;
  totalPages:   number;
  pageSize:     number;
  totalItems:   number;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginationStateDTO<T> {
  const totalItems  = items.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage    = Math.min(Math.max(1, page), totalPages);
  const start       = (safePage - 1) * pageSize;
  const pageItems   = items.slice(start, start + pageSize);

  return { items: pageItems, currentPage: safePage, totalPages, pageSize, totalItems };
}
