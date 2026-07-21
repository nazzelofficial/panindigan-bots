/**
 * constants/index.ts v0.2.6
 * Centralized constants — one file for all magic numbers, limits, and timing.
 * Never hard-code these values in command or service files; import from here.
 *
 * v0.2.6 changes:
 *   • Updated status colors to Discord-standard palette
 *   • Added per-feature embed color tokens (Music, AI, Moderation, etc.)
 *   • Added engagement/gamification constants (XP, badges, streaks)
 *   • Added pagination custom-ID prefixes for universal pagination engine
 *   • Added notification + digest constants
 */

// ── Bot identity ──────────────────────────────────────────────────────────────
export const BOT_VERSION  = "0.2.6" as const;
export const BOT_NAME     = "Panindigan Official" as const;
export const BOT_TAGLINE  = "Enterprise-grade Discord Bot for PH communities" as const;
export const BOT_WEBSITE  = "https://bot.panindigan.com" as const;
export const BOT_FOOTER   = `🤖 ${BOT_NAME}` as const;

// ── Brand / Design tokens v0.2.6 ─────────────────────────────────────────────
// Status colors now aligned with Discord's standard color palette
export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  PRIMARY:      0x7C3AED,  // Panindigan violet — brand headers, dashboard
  ACCENT:       0x5865F2,  // Discord blurple — interactive elements, links

  // ── Status (v0.2.6 Discord-standard) ──────────────────────────────────────
  SUCCESS:      0x57F287,  // Discord green  — confirmations, OK states
  WARNING:      0xFEE75C,  // Discord yellow — cautions, alerts
  DANGER:       0xED4245,  // Discord red    — errors, destructive actions
  INFO:         0x5865F2,  // Discord blurple — neutral information
  LOADING:      0x95A5A6,  // Gray           — background/in-progress

  // ── Feature-specific (v0.2.6) ─────────────────────────────────────────────
  MUSIC:        0x9B59B6,  // Purple  — music platform
  AI:           0x1ABC9C,  // Teal    — AI responses
  MODERATION:   0xE67E22,  // Orange  — moderation actions
  WELCOME:      0x3498DB,  // Sky     — server welcome
  TICKET:       0x5865F2,  // Indigo  — support tickets
  LOGGING:      0x2C3E50,  // Dark    — audit logs
  STATISTICS:   0x00BCD4,  // Cyan    — stats embeds
  PREMIUM:      0xF1C40F,  // Gold    — premium-gated features
  GOLD:         0xF1C40F,  // Gold    — alias
  ANNOUNCEMENT: 0xE91E63,  // Pink    — server announcements

  // ── Legacy aliases (maintained for backward-compat) ───────────────────────
  SURFACE:      0x1E1E2E,  // Dark surface — neutral loading / in-progress
  ERROR:        0xED4245,  // Alias for DANGER
} as const;

// ── Discord embed limits ───────────────────────────────────────────────────────
export const EMBED_LIMITS = {
  TITLE:       256,
  DESCRIPTION: 4096,
  FIELD_NAME:  256,
  FIELD_VALUE: 1024,
  FOOTER:      2048,
  AUTHOR_NAME: 256,
  FIELDS:      25,
  TOTAL_CHARS: 6000,
} as const;

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE:    10,
  MAX_PAGE_SIZE:        25,
  COLLECTOR_TIMEOUT_MS: 120_000,   // 2 min
  IDLE_TIMEOUT_MS:       60_000,   // 1 min
  MAX_PAGES:            100,
} as const;

// ── Timing / response targets (v0.2.6 spec) ───────────────────────────────────
export const TIMING = {
  /** Max ms for instant actions before deferred reply is needed. */
  INSTANT_ACTION_MS:   100,
  /** Target max for DB-backed responses. */
  DB_QUERY_TARGET_MS:  300,
  /** Target max for external API calls (after showing loading state). */
  API_CALL_TARGET_MS:  1_000,
  /** Collector idle timeout — used by interactive flows. */
  COLLECTOR_IDLE_MS:   60_000,
  /** Collector max lifetime. */
  COLLECTOR_MAX_MS:   300_000,
  /** Defer interaction before this many ms. */
  DEFER_THRESHOLD_MS:   2_500,
} as const;

// ── Cache TTL ────────────────────────────────────────────────────────────────
export const CACHE_TTL = {
  GUILD_CONFIG_MS:  300_000,   // 5 min  (v0.2.6: extended per spec)
  PREMIUM_MS:       600_000,   // 10 min (v0.2.6: extended per spec)
  PERMISSION_MS:     60_000,   // 1 min  (v0.2.6: new — permission check cache)
  USER_MS:           30_000,   // 30 s
  COMMANDS_MS:      300_000,   // 5 min
  QUERY_MS:          30_000,   // 30 s
} as const;

// ── Rate limits ───────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  /** Hits per window for global command rate limiting. */
  GLOBAL_HITS:       10,
  GLOBAL_WINDOW_MS:  10_000,
  /** Per-user hits per window for most commands. */
  USER_HITS:          5,
  USER_WINDOW_MS:    10_000,
  /** Economy-specific rate limit. */
  ECONOMY_HITS:       3,
  ECONOMY_WINDOW_MS: 30_000,
} as const;

// ── Retry / backoff ───────────────────────────────────────────────────────────
export const RETRY = {
  DB_BACKOFF_MS:       [1_000, 2_000, 5_000, 10_000, 30_000] as number[],
  LAVALINK_BACKOFF_MS: [2_000, 5_000, 10_000, 30_000, 60_000] as number[],
  API_BACKOFF_MS:      [500, 1_000, 2_000, 5_000] as number[],
  MAX_ATTEMPTS:        5,
  JITTER_MAX_MS:       500,
} as const;

// ── Input validation ──────────────────────────────────────────────────────────
export const VALIDATION = {
  MAX_STRING_LENGTH:    1_000,
  MAX_REASON_LENGTH:    512,
  MAX_MESSAGE_LENGTH:   2_000,
  MAX_CUSTOM_ID_LENGTH: 100,
  MAX_FILENAME_LENGTH:  256,
  /** Max attachment size in bytes (25 MB). */
  MAX_ATTACHMENT_BYTES: 26_214_400,
  /** Allowed image MIME types for attachment validation. */
  ALLOWED_IMAGE_TYPES:  ["image/png", "image/jpeg", "image/gif", "image/webp"] as string[],
  /** Blocked URL patterns (partial match). */
  BLOCKED_URL_PATTERNS: [
    "grabify.link", "iplogger.org", "2no.co", "blasze.com",
    "ps3cfw.com", "bmwforum.co", "leancoding.co",
  ] as string[],
} as const;

// ── Economy ───────────────────────────────────────────────────────────────────
export const ECONOMY = {
  STARTING_BALANCE:   500,
  DAILY_AMOUNT:       250,
  WORK_MIN:            50,
  WORK_MAX:           400,
  BEG_MIN:             10,
  BEG_MAX:            150,
  CRIME_SUCCESS_RATE:   0.45,
  CRIME_MIN:          100,
  CRIME_MAX:          600,
  CRIME_FINE_MIN:      50,
  CRIME_FINE_MAX:     300,
} as const;

// ── Leveling ──────────────────────────────────────────────────────────────────
export const LEVELING = {
  XP_PER_MSG_MIN:          15,
  XP_PER_MSG_MAX:          25,
  /** XP needed to reach level N: 5N² + 50N + 100 */
  xpForLevel: (level: number): number => 5 * level ** 2 + 50 * level + 100,
  COOLDOWN_MS:         60_000,   // 1 min between XP grants per user
} as const;

// ── Music ─────────────────────────────────────────────────────────────────────
export const MUSIC = {
  DEFAULT_VOLUME:           80,
  MAX_QUEUE_SIZE:          500,
  LEAVE_EMPTY_QUEUE_MS:  300_000,
  LEAVE_ON_END_MS:       300_000,
  PROGRESS_BAR_LENGTH:      20,
  VOTE_SKIP_THRESHOLD:       0.5,  // v0.2.6: 50% of voice channel must vote to skip
  AUDIO_FILTERS:           ["bassboost", "nightcore", "vaporwave", "8d", "karaoke",
                             "vibrato", "tremolo", "rotation", "distortion", "lowpass",
                             "highpass", "soft", "pop", "treble", "earrape"] as string[],
} as const;

// ── Moderation ────────────────────────────────────────────────────────────────
export const MODERATION = {
  MAX_PURGE_AMOUNT:    1_000,
  WARN_ESCALATION:     { 3: "mute:1h", 5: "kick", 7: "ban" } as Record<number, string>,
  AUDIT_LOG_LIMIT:      100,
  CASE_RETENTION_DAYS:  365,   // v0.2.6: configurable retention
  MSG_LOG_DAYS:          30,   // v0.2.6: message log retention
} as const;

// ── Antinuke ─────────────────────────────────────────────────────────────────
export const ANTINUKE = {
  DEFAULT_WINDOW_MS:    10_000,
  THRESHOLDS: {
    CHANNEL_DELETE:  3,
    CHANNEL_CREATE:  5,
    ROLE_DELETE:     3,
    BAN:             3,
    KICK:            5,
    WEBHOOK_CREATE:  3,
  },
} as const;

// ── Engagement & Gamification (v0.2.6) ────────────────────────────────────────
export const ENGAGEMENT = {
  STREAK_RECOVERY_DAYS:     3,   // Premium: days to recover a broken streak
  BADGE_DISPLAY_LIMIT:      5,   // Max badges shown on profile card
  LEADERBOARD_PAGE_SIZE:   10,
  DAILY_CHECKIN_BASE_XP:   50,
  STREAK_MULTIPLIER_MAX:    5.0, // 5× at max streak
} as const;

// ── Notification & Digest (v0.2.6) ────────────────────────────────────────────
export const NOTIFICATIONS = {
  DM_COOLDOWN_MS:       3_600_000,  // 1 hour between DM notifs of same type
  DIGEST_WEEK_DAY:      1,          // Monday (0=Sun … 6=Sat)
  DIGEST_HOUR:          9,          // 09:00 server timezone
} as const;

// ── Self-healing timeouts ─────────────────────────────────────────────────────
export const SELF_HEAL = {
  DB_RECONNECT_TIMEOUT_MS:        30_000,
  LAVALINK_FAILOVER_TIMEOUT_MS:   10_000,
  VOICE_REJOIN_TIMEOUT_MS:        15_000,
  CACHE_WARMUP_TIMEOUT_MS:         5_000,
  SCHEDULED_JOB_BACKOFF_MS:       60_000,
} as const;

// ── Collector custom-ID prefixes ──────────────────────────────────────────────
export const CUSTOM_ID = {
  // ── Universal pagination engine (v0.2.6) ──────────────────────────────────
  PAGINATOR_FIRST:   "pag:first",
  PAGINATOR_PREV:    "pag:prev",
  PAGINATOR_NEXT:    "pag:next",
  PAGINATOR_LAST:    "pag:last",
  PAGINATOR_JUMP:    "pag:jump",
  PAGINATOR_REFRESH: "pag:refresh",
  PAGINATOR_CLOSE:   "pag:close",

  // ── Help Center (v0.2.6) ──────────────────────────────────────────────────
  HELP_HOME:         "help:home",
  HELP_CATEGORIES:   "help:categories",
  HELP_SEARCH:       "help:search",
  HELP_FAVORITES:    "help:favorites",
  HELP_RECENT:       "help:recent",
  HELP_POPULAR:      "help:popular",
  HELP_GUIDE:        "help:guide",
  HELP_CLOSE:        "help:close",
  HELP_FEEDBACK_YES: "help:feedback:yes",
  HELP_FEEDBACK_NO:  "help:feedback:no",

  // ── Confirm dialog ─────────────────────────────────────────────────────────
  CONFIRM_YES:       "confirm:yes",
  CONFIRM_NO:        "confirm:no",

  // ── Music controls ─────────────────────────────────────────────────────────
  MUSIC_PAUSE:       "music:pause",
  MUSIC_SKIP:        "music:skip",
  MUSIC_STOP:        "music:stop",
  MUSIC_PREV:        "music:prev",
  MUSIC_SHUFFLE:     "music:shuffle",
  MUSIC_LOOP:        "music:loop",
  MUSIC_VOLUME:      "music:volume",
  MUSIC_FAVORITE:    "music:favorite",
  MUSIC_VOTESKIP:    "music:voteskip",   // v0.2.6: vote-to-skip

  // ── Error actions ─────────────────────────────────────────────────────────
  ERROR_RETRY:       "error:retry",
  ERROR_SUPPORT:     "error:support",
} as const;

// ── Category icons (shared across Help + embeds) ───────────────────────────────
export const CATEGORY_ICONS: Record<string, string> = {
  Admin:            "⚙️",
  AI:               "🤖",
  Economy:          "💰",
  Games:            "🎮",
  General:          "🏠",
  Giveaways:        "🎉",
  Leveling:         "📈",
  Logging:          "📋",
  Moderation:       "🛡️",
  Music:            "🎵",
  Owner:            "🔑",
  "Reaction Roles": "🔔",
  Roles:            "🎭",
  Scheduler:        "⏰",
  Settings:         "🎛️",
  Tickets:          "🎫",
  Utility:          "🛠️",
  Verification:     "✅",
  Welcome:          "👋",
} as const;
