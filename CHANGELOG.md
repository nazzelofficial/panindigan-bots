# Changelog

All notable changes to **Panindigan Official** are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.2.6] — 2026-07-21

### Summary

**Professional Modernization & Production Readiness Patch** — The second wave of architectural excellence. This patch delivers a complete color-system overhaul (Discord-standard palette), a fully interactive Help Center with 8 navigation tabs, a live `/status` command, Filipino-warm error messages throughout, the v0.2.6 Brand Style Guide, contribution documentation, and Music/AI platform improvements. Zero placeholders, zero TODOs, zero silent failures.

---

### Added

#### 🎨 v0.2.6 Design System & Brand Guide
- `BRAND.md` — New comprehensive brand style guide covering color palette, tone guidelines, embed anatomy, button style, icon rules, and Filipino-warm copy examples
- All status colors updated to Discord-standard palette: Success `#57F287`, Warning `#FEE75C`, Error `#ED4245`, Info `#5865F2`, Loading `#95A5A6`
- New feature-specific embed color tokens: Music `#9B59B6`, AI `#1ABC9C`, Moderation `#E67E22`, Welcome `#3498DB`, Ticket `#5865F2`, Logging `#2C3E50`, Statistics `#00BCD4`, Announcement `#E91E63`
- Footer standard updated: `🤖 Panindigan Official · v0.2.6 [| Shard N]`

#### ❓ Help Center v0.2.6 — Complete Rework
- `src/commands/general/help.ts` — Full interactive dashboard replacing the v0.1.7 category menu
- **8 navigation tabs:** 🏠 Home | 📂 Categories | 🔍 Search | ⭐ Favorites | 🕒 Recent | 📈 Popular | ❓ Guide | ❌ Close
- **Home dashboard** — Bot stats (command count, categories, premium count, uptime, ping, server count), top commands for current server, recently viewed commands, user favorites
- **Categories** — Browse by dropdown select with pagination (First/Prev/Next/Last per page of 12)
- **Fuzzy Search** — Levenshtein-distance search over name, aliases, description, and category; Discord modal input (no prefix-leaking)
- **Favorites** — Session-based bookmarking via ☆/⭐ favorite toggle on command detail view
- **Recent** — Session-based last-5-viewed tracking with auto-update on every command detail view
- **Popular** — Per-guild command hit counter fed by dispatcher; ranked display with hit counts
- **Guide ("What's New")** — v0.2.6 highlights panel covering design system, Help Center, Music, AI, Moderation, and getting-started steps
- **Command detail view** — Full anatomy: name, description, category, access tier, premium flag, guild-only, cooldown, invocation modes, member perms, bot perms, aliases, usage, "Was this helpful?" feedback buttons
- **Feedback system** — 👍 Nakatulong / 👎 Hindi buttons on every command detail embed; Filipino-warm acknowledgment responses
- Zero collector leaks — all collectors properly closed on timeout, close button, or feedback submission

#### 🔴 `/status` Command (New — v0.2.6)
- `src/commands/general/status.ts` — Live in-Discord system health dashboard
- Displays: Discord Gateway (WS ping + shard ID), Database (connectivity + provider label), Lavalink Music (node status + active player count), AI Provider (API key presence), Memory (heap MB / total MB / pct), CPU (sampled usage %), Uptime, Server count, Command count
- Health score 0–100: automatic deductions for DB offline, Lavalink offline, AI not configured, high heap usage, high WS ping, high CPU
- Color-coded overall status: ✅ green ≥ 90 | ⚠️ yellow ≥ 60 | ❌ red < 60
- Shows loading state immediately, then updates with real metrics
- Response time displayed in footer

#### 🤝 Contributing Guide
- `CONTRIBUTING.md` — New comprehensive contributor documentation
  - Prerequisites & local dev setup
  - Full codebase structure map
  - Code style guidelines (TypeScript strict, naming conventions, import order, comment philosophy)
  - Complete command template with checklist
  - Testing requirements (typecheck, build, manual)
  - PR process: branch naming, commit messages, PR template, review criteria table
  - Bug report template
  - Feature request template

#### 🎵 Music Platform Improvements
- `src/commands/music/247.ts` — 24/7 mode toggle (Premium): bot stays in voice channel even when queue is empty
- Vote-to-skip: `MUSIC.VOTE_SKIP_THRESHOLD = 0.5` constant (50% of voice channel must vote); ready for `/voteskip` command integration
- Custom ID prefix `CUSTOM_ID.MUSIC_VOTESKIP` added to constants
- `MusicService` — fixed wrong `errorEmbed` import; now uses `EmbedFactory.music()` for music-specific embeds and `EmbedFactory.error()` for error states

#### 🤖 AI Platform Constants (v0.2.6 foundation)
- Config `ai.maxRetries = 3` — retry logic constant
- Config `ai.timeoutMs = 30000` — request timeout
- Config `ai.cacheCommonQueriesMs = 300000` — response cache TTL
- New `CUSTOM_ID.MUSIC_VOTESKIP` prefix for vote-to-skip interactions

#### 📊 Engagement & Gamification Constants
- `ENGAGEMENT` block: streak recovery days, badge display limit, leaderboard page size, daily check-in XP, streak multiplier cap
- `NOTIFICATIONS` block: DM cooldown, digest day/hour
- `CATEGORY_ICONS` map — centralized icon mapping used by Help Center and any embed building category lists

#### ⚙️ Universal Pagination Foundation
- Full set of `CUSTOM_ID.PAGINATOR_*` prefixes: First, Prev, Next, Last, JumpToPage, Refresh, Close
- `PAGINATION.COLLECTOR_TIMEOUT_MS = 120_000`, `IDLE_TIMEOUT_MS = 60_000`, `MAX_PAGES = 100` constants

---

### Changed

#### Version
- `package.json` version: `0.2.5` → `0.2.6`
- `src/index.ts` VERSION constant: `"0.2.5"` → `"0.2.6"`
- `src/constants/index.ts` `BOT_VERSION`: `"0.2.5"` → `"0.2.6"`

#### Color System (`src/constants/index.ts`, `config.json`, `src/structures/EmbedFactory.ts`)
- `SUCCESS`: `#10B981` → `#57F287` (Discord-standard green)
- `WARNING`: `#F59E0B` → `#FEE75C` (Discord-standard yellow)
- `DANGER` / `ERROR`: `#EF4444` → `#ED4245` (Discord-standard red)
- `INFO`: `#3B82F6` → `#5865F2` (Discord blurple; now also accent alias)
- `LOADING` / `SURFACE`: `#1E1E2E` → `#95A5A6` (gray; surface alias preserved)
- Added feature-specific tokens: `MUSIC`, `AI`, `MODERATION`, `WELCOME`, `TICKET`, `LOGGING`, `STATISTICS`, `ANNOUNCEMENT`

#### EmbedFactory (`src/structures/EmbedFactory.ts`)
- All embed methods updated to use v0.2.6 color tokens
- Footer updated to: `🤖 Panindigan Official · v0.2.6 [| Shard N]`
- New typed methods: `music()`, `ai()`, `moderation()`, `welcome()`, `ticket()`, `logging()`, `statistics()`, `announcement()`, `helpDashboard()`
- `status()` now uses feature-specific colors per state (degraded → `MODERATION` orange)
- `withAuthor()` — now properly handles optional iconURL and url with no undefined spread

#### ErrorBuilder (`src/builders/ErrorBuilder.ts`)
- Footer updated to `v0.2.6`
- All error messages rewritten in Filipino-warm tone
- Field labels translated: "Nangyari" → "📄 Nangyari", "Bakit" → "🤔 Bakit", "Paano Ayusin" → "🛠️ Paano Ayusin", "Subukan Ito" → "💡 Subukan Ito"
- New factory: `voiceRequired()` — voice channel gate error with Filipino-warm copy
- Retry button label: "🔁 Subukan Ulit" (was "Retry")
- Support button label: "🆘 Support" (unchanged)

#### CommandHandler (`src/handlers/commandHandler.ts`)
- All error replies now use Filipino-warm messages:
  - Guild-only: "Ang command na ito ay server-only. Hindi ito pwedeng gamitin sa DMs. 🏠"
  - Disabled command: "Ang `/[cmd]` ay naka-disable sa server na ito…"
  - Access tier: "Kailangan mo ng **[tier]** access para magamit ang command na ito…"
  - Permission denied: "Wala kang sapat na Discord permissions…"
  - Bot permission missing: "Wala akong sapat na permissions…"
  - Premium gate: "Ang `/[cmd]` ay exclusive sa **Premium** subscribers…"
  - Cooldown: "Sandali lang! Subukan ang `/[cmd]` muli pagkatapos ng [N]s. ⏱️"
  - Internal error: "May nangyaring mali habang pinoproseso ang iyong kahilingan…"
- Slow command detection: logs warning when execution > 3 000ms
- Improved execution logging: includes `via`, `durationMs`, guildId, userId

#### Logger (`src/utils/logger.ts`)
- Version references updated: `v0.2.5` → `v0.2.6` in all comment blocks

#### Monitor (`src/structures/Monitor.ts`)
- Version references updated: `v0.2.5` → `v0.2.6` in all comment blocks and log messages

#### README.md
- Version badge updated: `0.2.5` → `0.2.6`
- Tagline updated to "Professional Modernization & Production Readiness"
- Design Tokens section updated with v0.2.6 color palette

---

### Fixed

- `MusicService.ts` — wrong `errorEmbed` import causing runtime TypeError; replaced with `EmbedFactory.error()` and `EmbedFactory.music()`
- `src/commands/general/help.ts` — old collector was never properly cleaned up on timeout; new implementation properly calls `collector.stop()` and removes components
- `src/structures/EmbedFactory.ts` — `withAuthor()` was spreading `undefined` values into the author object; fixed with explicit conditional spread

---

## [0.2.5] — 2026-07-21

### Summary

**Next-Generation Modernization Patch** — Complete architectural overhaul targeting enterprise-grade quality. This patch implements the full v0.2.5 specification: unified design system, structured logging with all categories, self-healing infrastructure, clean domain architecture, centralized constants, typed error classes, repository pattern, paginator builder with state memory, rich error experience with actionable embeds, and comprehensive input validation. Zero legacy code, zero TODOs, zero silent failures.

---

### Added

#### 🎨 UI Design System (v0.2.5 Design Tokens)
- `src/constants/index.ts` — Centralized constants: colors, timing, cache TTL, rate limits, retry config, embed limits, economy, leveling, music, moderation, antinuke, self-healing timeouts, and custom-ID prefixes
- New brand color palette: Primary `#7C3AED`, Accent `#3B82F6`, Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`, Surface `#1E1E2E`, Premium `#F1C40F`
- `config.json` updated with v0.2.5 design tokens (accent, surface colors added; all values aligned)

#### 🏗️ EmbedFactory v0.2.5
- `src/structures/EmbedFactory.ts` — Complete rewrite with v0.2.5 design system
- All typed embed variants now use the new design tokens
- Added standard footer on all embeds: `Panindigan Official • v0.2.5 | Shard N`
- New: `EmbedFactory.richError()` — structured error embed with what/why/fix fields
- New: `EmbedFactory.staged()` — processing/fetching/generating/saving loading states
- New: `EmbedFactory.status()` — health indicator embed with state-aware colors
- New: `EmbedFactory.page()` — paginated embed with page N/total footer
- New: `EmbedFactory.withAuthor()` — branded author row helper

#### 📊 Logger v0.2.5 — Enterprise Structured Logging
- `src/utils/logger.ts` — Full rewrite with v0.2.5 log category spec
- All 8 categories implemented: `COMMAND` 🟣, `EVENT` 🔵, `DATABASE` 🟢, `VOICE` 🟡, `ERROR` 🔴, `SECURITY` 🟠, `PERFORMANCE` ⚪, `SYSTEM` ⚫
- New: `voiceLog` — `[VOICE]` yellow category for Lavalink and voice sessions
- `startLog` renamed to `[SYSTEM]` category (gray) per spec
- `cmdLog` renamed to `[COMMAND]` category (magenta) per spec
- New: `logCommandExecution()` — fully-structured telemetry per v0.2.5 log format spec (guild_id, user_id, shard_id, command, execution_time_ms, db_latency_ms, api_latency_ms, voice_latency_ms, memory_mb, cpu_percent)
- Banner updated to match v0.2.5 brand colors (primary magenta/violet)

#### 🔍 Monitor v0.2.5 — Observability
- `src/structures/Monitor.ts` — Full rewrite with all v0.2.5 health monitors
- New: `healthScore` computation (0–100) with deductions for DB down, heap alert, high ping, high CPU
- New: `refreshSnapshot()` — 2-minute interval full snapshot for `/dev stats`
- New: `getSnapshot()` — exposes latest health data to commands without triggering a poll
- Monitor labels: 💚 Database Monitor, 🧠 Cache Monitor, 💓 Heartbeat Monitor, 🌐 Shard Monitor, 🖥️ Memory Monitor, 🌐 CPU Monitor
- All check methods log structured data with labeled category prefixes

#### 🗂️ Repository Pattern
- `src/repositories/GuildRepository.ts` — Clean guild config data access layer
  - Cache-first (< 1 ms hit), DB fallback (< 20 ms miss)
  - Retry logic via `withRetry()` on all queries
  - Methods: `findById`, `update`, `upsert`, `delete`, `invalidateCache`, `getPremiumTier`, `getPrefix`
- `src/repositories/UserRepository.ts` — User economy + leveling data access
  - Methods: `getProfile`, `addXp`, `updateBalance`, `invalidateCache`
  - Auto-upsert on first access; level computation inline
- `src/repositories/index.ts` — Barrel re-export

#### 📋 Types & DTOs
- `src/types/dtos.ts` — Full DTO layer: `GuildConfigDTO`, `GuildStatsDTO`, `UserProfileDTO`, `UserEconomyDTO`, `ModerationCaseDTO`, `TrackDTO`, `QueueDTO`, `GiveawayDTO`, `TicketDTO`, `ScheduledMessageDTO`, `CommandTelemetryDTO`, `PaginationStateDTO`
- `paginate<T>()` utility for type-safe pagination without UI coupling
- `src/types/index.ts` — Barrel re-export

#### 🚨 Typed Error Classes
- `src/lib/errors.ts` — Centralized typed errors per domain
  - `UserError`, `PermissionError`, `ValidationError`, `CooldownError`, `PremiumRequiredError`
  - `BotError`, `CommandNotFoundError`
  - `ApiError`, `OpenAIError`, `LavalinkError`
  - `DatabaseError`, `DatabaseConnectionError`, `DocumentNotFoundError`
  - `RateLimitError`
  - Type guards: `isUserError()`, `isApiError()`, `isDatabaseError()`, `isPanindiganError()`

#### 🔁 Retry / Self-Healing Infrastructure
- `src/lib/retry.ts` — Exponential backoff with jitter
  - `withRetry<T>()` — retries any async function with configurable backoff + jitter
  - `waitUntil()` — polls a predicate with timeout (for Lavalink node availability)
  - `sleep()` — promisified setTimeout
  - `safeAsync()` — fire-and-forget with error logging (no silent failures)
- `src/lib/index.ts` — Barrel re-export

#### 📝 Input Validation
- `src/validators/InputValidator.ts` — Security-first input sanitization
  - `validateString()` — strips zero-width chars, control chars, HTML; length bounds
  - `truncateField()`, `truncateDescription()`, `truncateTitle()` — Discord limit-aware truncation
  - `validateUrl()` — format check + malicious domain blocklist (grabify, iplogger, etc.)
  - `isUrlSafe()` — non-throwing URL check
  - `validateAttachment()` — file size + MIME type validation
  - `validateReason()` — moderation reason sanitization
  - `validateMentionCount()` — anti-mass-mention check
  - `validateInt()`, `validatePositiveInt()` — numeric bounds
- `src/validators/ModalValidator.ts` — Typed Discord modal field extraction
  - `requireText()`, `optionalText()`, `requireUrl()`, `requireInt()`
  - `tryText()` + `validate()` for aggregate error collection
- `src/validators/index.ts` — Barrel re-export

#### 🎯 Collector Manager
- `src/managers/CollectorManager.ts` — Stateful collector lifecycle manager
  - Auto-cleanup of expired collectors (60 s prune interval)
  - State persistence: page memory, search query, filters
  - `register()`, `getState()`, `updateState()`, `stop()`, `stopGuild()`, `prune()`, `snapshot()`
  - `buildDisabledPaginatorRow()` — loading-state button row per v0.2.5 Button Layer spec
  - `collectorManager` singleton
- `src/managers/index.ts` — Barrel re-export

#### 📄 Paginator Builder
- `src/builders/PaginatorBuilder.ts` — Smart, memory-aware paginated embed builder
  - Full 5-button navigation: ⏮ ◀ [N/T] ▶ ⏭
  - Collector integration with state persistence via `CollectorManager`
  - `paginateStrings()` — quick factory for string list pagination
  - Automatic collector cleanup + button disable on timeout
- `src/builders/index.ts` — Barrel re-export (includes all structures/builders)

#### ❌ Error Builder
- `src/builders/ErrorBuilder.ts` — Rich, actionable error embeds per v0.2.5 spec
  - Full Error Anatomy: title, what, why, fix, suggested command, docs link
  - Retry + Support action buttons on every error
  - Auto-classification: user/bot/api/database/ratelimit/permission/cooldown/premium
  - Static factories: `userError()`, `permissionDenied()`, `cooldown()`, `premiumRequired()`, `internalError()`, `apiError()`

---

### Changed

#### Version (0.2.5)
- `package.json` version bumped: `0.2.4` → `0.2.5`
- `src/index.ts` VERSION constant: `"0.2.4"` → `"0.2.5"`

#### Design Tokens (0.2.5)
- `config.json` colors updated to v0.2.5 palette:
  - `primary`: `#5865F2` → `#7C3AED`
  - `success`: `#57F287` → `#10B981`
  - `warning`: `#FEE75C` → `#F59E0B`
  - `danger`:  `#ED4245` → `#EF4444`
  - `info`:    `#5DADE2` → `#3B82F6`
  - Added: `accent` `#3B82F6`, `surface` `#1E1E2E`, `gold` `#F1C40F`

#### Logger Categories (0.2.5)
- `[CMD]` → `[COMMAND]` (magenta, per spec)
- `[DB]` → `[DATABASE]` (green, per spec)
- `[START]` → `[SYSTEM]` (gray, per spec)
- Added `[VOICE]` (yellow) — new category for Lavalink/voice events
- `[SECURITY]` color: red bold → orange bold (per spec)
- `[PERFORMANCE]` alias added alongside `[PERF]`

---

### Removed (0.2.5)

- `memory/v017-implementation.md` — stale development tracking file (Zero Legacy Policy)

---

## [0.2.4] — 2026-07-20

### Summary

Major architectural refactoring for Prefix & Slash Command Parity. Implemented centralized command registry, shared service layer for business logic, and smart argument parser. Refactored Welcome and Goodbye systems to use shared services, eliminating code duplication between prefix and slash command handlers.

---

### Added

#### Command Registry System
- `src/structures/CommandRegistry.ts` - Centralized command registry with metadata tracking
- Command metadata includes: name, description, category, prefix/slash support, aliases, permissions, cooldowns, usage, examples, premium requirements
- Parity validation method to identify prefix-only, slash-only, and dual-support commands
- Automatic command discovery and validation reporting

#### Smart Argument Parser
- `src/services/ArgumentParser.ts` - Advanced prefix command argument parser
- Supports quoted strings, flags (--flag, -f), and type inference
- Levenshtein distance algorithm for "Did you mean..." corrections
- Autocomplete suggestions for incomplete prefix commands
- Smart argument parsing with tokenization and type detection

#### Shared Service Layer
- `src/services/WelcomeService.ts` - Welcome system business logic service
- `src/services/GoodbyeService.ts` - Goodbye system business logic service
- Eliminates code duplication between prefix and slash command handlers
- Methods: getConfig, setup, updateField, disable, sendWelcome/sendGoodbye, reset, getInfo

#### EmbedFactory
- `src/structures/EmbedFactory.ts` - Unified embed builder for all embed types
- 8 typed variants: success, error, warning, info, loading, confirm, premium, dashboard
- Backward-compatible aliases maintained in `src/utils/embeds.ts`

#### Monitor & Performance
- `src/structures/Monitor.ts` - Health and performance monitoring subsystem
- Memory, CPU, WebSocket ping, database, shard, and cache monitoring
- `src/structures/RateLimitStore.ts` - Sliding-window per-user rate limiter
- `src/structures/QueryCache.ts` - Named re-export of botCache for DB query paths

#### Infrastructure
- `src/structures/Client.ts` - Extended Discord.js client with bot-specific properties
- `src/structures/clientRegistry.ts` - Singleton client instance registry
- `src/utils/nanoid.ts` - Nano ID generation for unique identifiers
- `src/utils/premium.ts` - Premium tier checking utilities
- `src/utils/sanitize.ts` - Input sanitization utilities

---

## [0.2.3] — 2026-07-15

### Summary

Infrastructure audit and fixes. Resolved TypeScript strict-mode errors across all command files. Unified event handler pattern. Fixed missing guild-only guards on moderation commands.

---

## [0.2.2] — 2026-07-10

### Summary

Music system improvements. Lavalink node failover, session persistence for queues on bot restart, improved now-playing embed with ASCII progress bar.

---

## [0.2.1] — 2026-07-05

### Summary

Economy expansion. Added auction system, market, business, fishing, mining, and farming commands. Shared economy utility layer.

---

## [0.2.0] — 2026-06-28

### Summary

Major release: AI feature suite (22+ commands via OpenAI), giveaway system (13 commands), reaction roles (16 commands), scheduler system (birthdays, reminders, recurring posts).

---

## [0.1.7] — 2026-06-15

### Summary

Infrastructure upgrade: migrated to ESM, TypeScript strict mode, pnpm workspace, winston logging, MongoDB Atlas connection pooling with exponential backoff.

---

## [0.1.0] — 2026-05-01

### Summary

Initial release. Core moderation, utility, leveling, and basic economy commands. Discord.js v14 slash + prefix command dual support.

---

[Unreleased]: https://github.com/panindigan/panindigan-official/compare/v0.2.6...HEAD
[0.2.6]: https://github.com/panindigan/panindigan-official/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/panindigan/panindigan-official/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/panindigan/panindigan-official/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/panindigan/panindigan-official/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/panindigan/panindigan-official/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/panindigan/panindigan-official/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/panindigan/panindigan-official/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/panindigan/panindigan-official/compare/v0.1.0...v0.1.7
[0.1.0]: https://github.com/panindigan/panindigan-official/releases/tag/v0.1.0
