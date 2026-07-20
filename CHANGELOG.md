# Changelog

All notable changes to **Panindigan Official** are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.2.2] — 2026-07-20

### Summary

Critical bug fixes for music system message handling and channel routing. Fixed "Cannot edit a message authored by another user" error for prefix commands by implementing proper bot message storage and editing flow. Fixed music embeds being sent to wrong text channels by using stored textChannelId from player instead of random channel selection.

---

### Fixed

#### Music System — Message Editing Flow
- Fixed "Cannot edit a message authored by another user" error for prefix commands (P!play)
- Implemented proper bot message storage for prefix commands using message.reply()
- Added defensive checks before editing messages (author.id === client.user.id)
- Separated reply/edit logic cleanly for prefix vs slash commands
- Added graceful fallback to send new message if editing is impossible
- Fixed TypeScript errors related to ctx.client.user null checks

#### Music System — Channel Routing
- Fixed music embeds being sent to wrong text channels (e.g., #welcome instead of #music)
- Removed random channel selection logic (guild.channels.cache.find(), guild.systemChannel)
- Updated all music event handlers to use stored player.textChannelId
- Fixed trackStart event to use player.textChannelId instead of random channel
- Fixed trackEnd event to use player.textChannelId instead of random channel
- Fixed queueEnd event to use player.textChannelId instead of random channel
- Fixed voice disconnect events to use player.textChannelId instead of voiceChannelId
- Ensured textChannelId is preserved during queue updates, skip, stop, pause, resume, shuffle, loop, autoplay

---

## [0.2.1] — 2026-07-20

### Summary

Premium music system complete overhaul. Redesigned entire music subsystem with enterprise-grade UI/UX, professional embeds, complete metadata handling, animated progress bars, premium button controls, and polished playback experience. All music interfaces now feature modern design, consistent branding, mobile-friendly formatting, and professional presentation comparable to top-tier commercial music bots.

---

### Added

#### Music System — Premium UI/UX Overhaul
- Premium embed builder module with consistent branding and modern design
- Dynamic accent colors based on music source (YouTube, Spotify, SoundCloud, etc.)
- Animated/dynamic progress bar with smooth updates
- Premium button row with 12 controls (Previous, Pause/Resume, Skip, Stop, Shuffle, Loop, Queue, Lyrics, Filters, Volume, Favorite, Autoplay)
- Automatic button timeout with proper collector cleanup
- Metadata resolver with comprehensive fallbacks (never displays "undefined", "Unknown", "null", or "N/A")
- Rich thumbnails and artwork for all tracks
- Mobile-friendly embed formatting with proper spacing and typography

#### Music Embeds — Complete Redesign
- **Now Playing Embed**: Song title, artist, album, duration, current position, animated progress bar, source platform, thumbnail, playlist name, requested by, queue position, queue size, remaining duration, voice channel, volume, playback speed, pitch, bass boost, filters enabled, loop mode, shuffle status, autoplay status, live stream badge, explicit badge, verified artist badge
- **Playback Event Embeds**: Professional "Track Started", "Track Finished", "Auto-Playing Next", "Queue Finished", "Autoplay Started", "Disconnected", "Reconnecting", "Node Restored" notifications
- **Queue Embed**: Current track highlight, "Up Next" section, requester, duration, estimated remaining time, pagination (X/Y), total songs, total queue duration
- **Search Results Embed**: Thumbnails, artist, duration, views (if available), source platform, numbered results, improved selection interface
- **Lyrics Embed**: Modern design with pagination, scrollable content, source attribution
- **Playlist Loading Embed**: Playlist name, artwork, songs imported count, estimated duration, loading progress, completion summary
- **Filter UI Embed**: Modern interface for Bass Boost, Nightcore, 8D, Vaporwave, Karaoke, Treble, Speed, Pitch, Equalizer, Rotation, Timescale, Low Pass filters

#### Music System — Metadata Quality
- Comprehensive metadata validation before display
- Proper fallback values for missing metadata (e.g., "Artist unavailable" instead of "Unknown")
- Lavalink metadata integration
- YouTube metadata extraction
- Playlist metadata handling
- Artwork metadata resolution
- Author/uploader metadata processing
- Track info validation
- Explicit content badge detection
- Verified artist badge detection
- Live stream detection

#### Music System — Professional Logging
- Track Start logging with metadata
- Track End logging with duration
- Track Stuck detection and logging
- Track Exception logging with error details
- Queue Empty logging
- Player Destroyed logging
- Voice Moved logging
- Node Connected/Disconnected/Reconnected logging
- Node Failover logging
- Playlist Loaded logging
- Search Completed logging

---

### Changed

#### Music System — Complete Refactor
- All music commands migrated to use new premium embed system
- Removed all plain text responses in favor of embeds
- Improved error embeds with professional presentation
- Enhanced success embeds with rich details
- Better warning embeds with clear guidance
- Improved reconnect embeds with progress indication
- Better playlist loading embeds with progress tracking
- Enhanced queue embeds with pagination and highlights
- Improved search result embeds with thumbnails
- Better lyrics embeds with pagination
- Enhanced autoplay embeds with notifications
- Optimized embed reuse to prevent unnecessary API requests
- Prevented duplicate interactions
- Optimized queue updates for smooth performance
- Implemented smooth playback transitions

#### Music System — Performance
- Embed reuse to minimize Discord API requests
- Collector leak prevention with proper cleanup
- Optimized queue update logic
- Efficient progress bar updates without API spam
- Smooth playback transitions
- Automatic button timeout with cleanup

---

### Fixed

#### Music System — Metadata Handling
- Fixed display of "undefined", "Unknown", "null", "N/A" in embeds
- Fixed missing thumbnails causing broken embeds
- Fixed empty metadata causing incomplete embeds
- Fixed inconsistent metadata across different sources
- Fixed missing album information display
- Fixed artist/author display issues

#### Music System — UI/UX
- Fixed inconsistent embed styling across music commands
- Fixed poor mobile formatting
- Fixed inconsistent spacing and typography
- Fixed broken field alignment
- Fixed missing dynamic accent colors
- Fixed inconsistent branding

---

## [0.2.0] — 2026-07-20

### Summary

Major AI provider migration and Lavalink health monitoring release. Migrated entire AI subsystem from OpenAI API to Groq API for improved performance and cost efficiency. Fixed critical Lavalink health monitoring issues where connected nodes were incorrectly reported as disconnected. Updated all environment variable references and documentation.

---

### Added

#### AI System — Groq Migration
- Groq API integration as primary AI provider (drop-in OpenAI-compatible)
- Configurable AI model via `AI_MODEL` environment variable (default: llama-3.3-70b-versatile)
- `getGroqClient()` function in openaiClient.ts with Groq-specific baseURL configuration
- `getAiModel()` function for model configuration retrieval
- User-friendly error messages for AI service unavailability (generic "temporarily unavailable" messages)
- Structured error logging for all AI command failures

---

### Changed

#### AI System — Complete Migration
- Migrated all text AI commands to Groq: `chat`, `code`, `codeexplain`, `grammar`, `rewrite`, `summarize`, `translate`
- Updated `ai.ts` multi-subcommand command to use Groq for chat, translate, summarize, and code subcommands
- Changed environment variable from `OPENAI_API_KEY` to `GROQ_API_KEY`
- Updated ENV_SCHEMA to include `GROQ_API_KEY` and `AI_MODEL` variables
- Updated `envcheck.ts` owner command to check for `GROQ_API_KEY` and `AI_MODEL`
- Updated `settings.ts` to display "Groq (Llama 3.3)" as provider instead of "OpenAI GPT-4o"
- Replaced `describeOpenAiError()` with `describeAiError()` for generic error handling
- Updated all AI command error messages to use generic "AI service temporarily unavailable" text

#### AI System — Disabled Features
- Image generation commands (`image`, `imagegen`, `texttoimage`) disabled with informative message (Groq does not support image generation)
- Content moderation command (`moderate`) disabled with informative message (Groq does not support moderation API)
- Audio transcription command (`voicetotext`) disabled with informative message (Groq does not support Whisper)
- Image analysis subcommand in `ai.ts` disabled with informative message

#### Music System — Health Monitoring Fixes
- Removed deprecated node state assumptions (`state`, `wsReadyState`, `connected`, `websocketOpen`, `authenticated`)
- Rewrote `getNodeHealthInfo()` to use only official lavalink-client v2.10.3 API properties
- Health validation now based on `sessionId` presence and `stats` reception
- Updated `NodeHealthInfo` interface to use `hasSession` and `hasStats` instead of deprecated properties
- Updated `isNodeHealthy()` to check `connected && hasSession && hasStats`
- Enhanced debug logging to show actual API properties being checked
- Updated `musicManager.ts` node connection logging to remove deprecated property references
- Updated `healthMonitor.ts` logging to use new health properties

---

### Fixed

#### Music System — Health Monitoring
- Fixed false "Disconnected" reports for connected Lavalink nodes
- Fixed incorrect node readiness detection by using official API signals
- Fixed TypeScript errors from accessing non-existent node properties
- Fixed health monitoring to correctly identify nodes as ready when authenticated with active session

#### AI System — Migration
- Fixed all AI commands to use new Groq client functions
- Fixed environment variable validation to check for `GROQ_API_KEY` instead of `OPENAI_API_KEY`
- Fixed error handling to provide generic user-friendly messages instead of provider-specific details

---

## [0.1.9] — 2026-07-20

### Summary

Production-grade Lavalink music system audit and command organization release. Implemented comprehensive music system reliability improvements including node readiness validation, automatic failover, health monitoring, voice lifecycle cleanup, and guild isolation. Resolved all duplicate command names and aliases that were causing warnings during command loading.

---

### Added

#### Music System — Production-Grade Reliability
- Comprehensive node health validation before all music operations (connected, ready, WebSocket open, authenticated)
- Automatic node failover with multiple Lavalink node support (comma-separated env vars)
- Health monitoring background service running every 30 seconds with structured logging
- Voice connection lifecycle cleanup (bot leave, kick, guild delete, queue end, player errors)
- Node health tracking with consecutive failure/recovery thresholds
- Healthiest node selection based on latency, CPU load, and player count
- Detailed node health information interface (ping, memory, CPU, player count)
- Multiple node configuration parsing from environment variables
- Automatic failover on critical errors (authentication, connection refused)
- Structured health logging with node status metrics

---

### Changed

#### Music System
- Enhanced validateMusicOperation() with comprehensive node health checks
- Added isNodeHealthy() function for node readiness validation
- Added getHealthyNode() function to find healthy nodes
- Added getNodeHealthInfo() for detailed node metrics
- Added getAllNodesHealthInfo() for monitoring all nodes
- Updated musicManager.ts with voice lifecycle event handlers
- Updated musicManager.ts with automatic failover logic
- Updated musicManager.ts with health monitor integration
- Added healthMonitor.ts module for background health checks
- Enhanced node connection logging with structured health info

---

### Fixed

#### Command System
- Fixed duplicate command name "poker" - renamed games/poker.ts to "videopoker"
- Fixed duplicate command name "ping" - renamed owner/ping.ts to "shardping"
- Fixed duplicate command name "raidmode" - renamed owner/raidmode.ts to "globalraidmode"
- Fixed duplicate command name "changelog" - renamed owner/changelog.ts to "broadcastchangelog"
- Fixed duplicate command name "rate" - renamed utility/rate.ts to "utilityrate"
- Fixed duplicate command name "riddle" - renamed utility/riddle.ts to "utilityriddle"
- Fixed duplicate command name "roll" - renamed utility/roll.ts to "utilityroll"
- Fixed duplicate command name "rps" - renamed utility/rps.ts to "utilityrps"
- Fixed duplicate command name "ship" - renamed utility/ship.ts to "utilityship"
- Fixed duplicate command name "shuffle" - renamed utility/shuffle.ts to "utilityshuffle"
- Fixed duplicate command name "sticker" - renamed utility/sticker.ts to "stickerinfo"
- Fixed duplicate command name "tictactoe" - renamed utility/tictactoe.ts to "utilitytictactoe"
- Fixed duplicate command name "trivia" - renamed utility/trivia.ts to "utilitytrivia"
- Fixed duplicate command name "truthordare" - renamed utility/truthordare.ts to "utilitytruthordare"
- Fixed duplicate command name "wordle" - renamed utility/wordle.ts to "utilitywordle"
- Fixed duplicate command name "wouldyourather" - renamed utility/wouldyourather.ts to "utilitywouldyourather"
- Fixed duplicate alias "job" - removed from work.ts (kept in jobs.ts)
- Fixed duplicate alias "lockdown" - removed from lock.ts (kept in serverlock.ts)
- Fixed duplicate alias "prune" - removed from purge.ts (kept in prunemember.ts)
- Fixed duplicate alias "untimeout" - removed from timeout.ts (kept in unmute.ts)
- Fixed duplicate alias "announce" - removed from growthannounce.ts (kept in say.ts)

---

## [0.1.8] — 2026-07-20

### Summary

Infrastructure and music system stability release. Migrated build system from tsup to native TypeScript compiler (tsc) for better compatibility with Node.js 24+ and native ESM. Implemented production-grade Lavalink music system with comprehensive error handling, validation, and graceful degradation. Music commands now fail gracefully when Lavalink is unavailable without affecting other bot features.

---

### Changed

#### Build System — tsup to tsc Migration
- Removed tsup dependency and configuration completely
- Migrated to native TypeScript compiler (tsc) for compilation
- Updated tsconfig.json for Node.js 24+ compatibility with native ESM
- Changed moduleResolution from "bundler" to "node" for proper runtime resolution
- Removed path aliases (@/) and converted all 582 files to relative imports
- Added .js extensions to all relative imports for ESM compatibility
- Updated Dockerfile to use tsc build output (removed manual src copying)
- Build script now: `pnpm clean && tsc`
- All 780 TypeScript files compile successfully with zero errors
- Full folder structure preserved in dist/ output

#### Music System — Production-Grade Lavalink Implementation
- Added LAVALINK_SECURE to ENV_SCHEMA for WSS/WS configuration
- Created comprehensive music utility module (`src/utils/music.ts`) with validation
- Implemented MusicStatus enum for tracking Lavalink availability states
- Added configuration validation (host, port, password, secure flag)
- Implemented duplicate initialization prevention in musicManager
- Added comprehensive event logging (connect, disconnect, error, reconnect, destroy)
- Implemented detailed startup diagnostics showing connection configuration
- Added specific error type detection (authentication, connection refused, DNS, timeout, SSL/TLS)
- Implemented retry configuration with exponential backoff support
- Added client music status tracking in PanindiganClient
- Updated 41 music commands with validateMusicOperation() checks
- All music commands now return user-friendly error messages when Lavalink unavailable
- Bot remains fully operational when Lavalink is offline or unreachable
- No uncaught exceptions from music system failures

---

### Fixed

#### Music System
- Fixed "No available Node was found" error with proper node validation
- Fixed "Unable to connect after 5 attempts" with improved error handling
- Fixed music commands throwing uncaught exceptions when Lavalink unavailable
- Fixed race conditions in Lavalink initialization
- Fixed missing node connection checks before player creation
- Fixed TypeScript errors related to Lavalink node state checking

#### Build System
- Fixed unresolved path aliases in compiled JavaScript
- Fixed missing .js extensions causing ESM module resolution errors
- Fixed Docker build requiring manual file copying
- Fixed tsup bundling issues with dynamic imports

---

## [0.1.7] — 2026-07-19

### Summary

Major quality-and-infrastructure release. No new commands — this patch is a full horizontal upgrade of the bot's internals, making every existing command faster, safer, and more consistent. Highlights: a unified embed builder with 8 typed variants, a structured logging pipeline with 10 log categories and colored console output, a global error handler with interaction timeout recovery, startup diagnostics with dependency/config validation and timing summary, a real-time monitoring subsystem (memory, CPU, ping, DB, shards, cache), autocomplete on every applicable slash command, input sanitization across all user-facing parameters, and environment variable validation at boot. TypeScript strictness raised, all remaining `any` escape hatches replaced with proper interfaces, and a reusable component builder library introduced for buttons, select menus, and modals. Database layer upgraded with connection pooling, automatic reconnect, query caching, and index optimisation.

---

### Added

#### Help Center — Enhancements
- Frequently-used commands section on the help homepage, derived from per-guild command hit counters stored in the database
- Permission indicators on every command detail page — shows required user permissions and required bot permissions side-by-side
- Cooldown indicator on every command detail page
- Command examples section on detail pages (up to 3 examples per command pulled from command metadata)
- Mobile-friendly embed layout: field widths capped, long descriptions truncated gracefully, inline fields reduced on narrow viewports
- Smart search suggestions — when a query matches nothing, the closest 3 commands are suggested with one-click buttons
- Improved pagination component: page X of Y counter, jump-to-first/jump-to-last buttons, auto-disable on boundary pages

#### Logging System — New Pipeline (10 log categories)
- Structured JSON log format for file output (`logs/combined.log`, `logs/error.log`) — every entry carries `timestamp`, `level`, `category`, `guild`, `user`, `command`, and `duration` fields
- Colored console output via `chalk` — each category has a distinct color prefix: `[CMD]` cyan, `[ERR]` red, `[WARN]` yellow, `[DB]` green, `[API]` magenta, `[PERF]` blue, `[START]` white bold, `[EVENT]` gray, `[INTERACTION]` cyan dim, `[SECURITY]` red bold
- Command execution log: logs every command invocation with guild ID, user ID, command name, subcommand, and wall-clock duration in ms
- Interaction log: logs every component interaction (button, select, modal) with component custom ID and resolution time
- Performance log: flags any operation exceeding 500 ms with a `SLOW` tag and full duration
- Database log: connection events, query counts, slow query alerts (> 200 ms), reconnect attempts
- API log: every external API call (OpenAI, Lavalink, weather) with status code and latency
- Security log: permission denials, cooldown hits, rate-limit triggers, and input sanitization rejections

#### Error Handling — Global Error Handler
- `unhandledRejection` and `uncaughtException` process-level handlers — logs full stack trace, sends error report to configured owner DM channel, and keeps the process alive
- Interaction timeout recovery — if a deferred reply is never resolved within 14.5 seconds, an automatic "Something went wrong — please try again" followUp is sent and the interaction is cleaned up
- Database failure recovery — all MongoDB operations wrapped in a retry helper (up to 3 attempts, 500 ms backoff); after 3 failures the operation rejects with a structured `DatabaseError` and the user receives a friendly error embed
- Graceful API failure — OpenAI and Lavalink calls caught individually; user gets a specific "AI service unavailable" or "music service unavailable" error instead of an unhandled crash
- Auto-retry on Discord API 429 rate-limit responses — waits `retry_after` ms and retries once before surfacing the error to the user

#### Startup Diagnostics
- Pre-flight checks at boot: validates all required environment variables are present and non-empty; exits with a clear list of missing variables if any are absent
- Dependency checks: verifies MongoDB is reachable and Discord gateway is accessible before finishing startup; exits with a descriptive error if either fails
- Command validation: ensures every loaded command has `name`, `description`, `category`, and `run`/`execute` fields; logs a warning for any malformed command file and skips it rather than crashing
- Event validation: ensures every loaded event has `name` and `execute` fields
- Startup timing: logs time-to-ready broken down by phase — module load, command load, event load, DB connect, Discord login, slash command cache
- Startup summary embed logged to console: total commands, total events, shard count, guild count (from cache), memory usage at ready

#### Monitoring Subsystem
- `Memory monitor` — polls `process.memoryUsage().heapUsed` every 60 s; logs a `WARN` if heap exceeds 512 MB; sends owner alert at 768 MB
- `CPU monitor` — samples CPU usage with a 100 ms interval; logs `PERF` warning if sustained usage exceeds 80 % for 5 consecutive samples
- `Ping monitor` — pings Discord gateway every 30 s; logs `WARN` if WebSocket latency exceeds 400 ms; tracks rolling 5-min average
- `Database health monitor` — runs a lightweight `db.admin().ping()` every 60 s; logs reconnect attempt on failure
- `API health monitor` — checks Lavalink node availability every 120 s; marks node unhealthy and removes it from the pool if unreachable
- `Uptime monitor` — exposes formatted uptime (days, hours, minutes) via the existing `botinfo` and `ping` commands
- `Shard monitor` — logs per-shard status (guild count, ping, status) every 5 minutes in sharded deployments
- `Cache monitor` — logs Discord.js cache sizes (guilds, users, members, channels, messages) every 10 minutes; warns if message cache grows beyond 10 000 entries

#### Components — Reusable Builder Library
- `ButtonBuilder` wrapper (`src/structures/builders/button.ts`) — factory functions for primary, secondary, success, danger, and link buttons with consistent style and disabled-state helpers
- `SelectMenuBuilder` wrapper (`src/structures/builders/select.ts`) — factory for string, user, role, channel, and mentionable select menus with consistent placeholder and option helpers
- `ModalBuilder` wrapper (`src/structures/builders/modal.ts`) — factory for modals with typed text input helpers (short and paragraph styles)
- Consistent component ID scheme: `<category>:<action>:<targetId>` — all existing component handlers migrated to this format
- Component versioning field in custom IDs: `v1` suffix appended; future breaking changes increment to `v2` without removing `v1` handlers until next minor release

#### Embeds — Unified Builder
- `EmbedFactory` (`src/structures/EmbedFactory.ts`) — single import for all embed types; replaces the scattered individual helper functions
  - `EmbedFactory.success(title, description)` — green left border, ✅ icon
  - `EmbedFactory.error(title, description)` — red left border, ❌ icon
  - `EmbedFactory.warning(title, description)` — yellow left border, ⚠️ icon
  - `EmbedFactory.info(title, description)` — blue left border, ℹ️ icon
  - `EmbedFactory.loading(title, description)` — grey left border, ⏳ icon
  - `EmbedFactory.confirm(title, description)` — orange left border, ❓ icon
  - `EmbedFactory.premium(title, description)` — gold left border, ⭐ icon
  - `EmbedFactory.dashboard(title, description)` — blurple left border, 🎛️ icon
- All existing embed helper calls (`successEmbed`, `errorEmbed`, `infoEmbed`, `warningEmbed`) aliased to `EmbedFactory` internally — no command-level changes required

#### Security
- Input sanitization helper (`src/utils/sanitize.ts`) — strips zero-width characters, control characters, and excessively long inputs (> 1 000 chars) from all user-provided string options before processing
- Owner verification middleware — every owner-gated command re-validates the invoker against `BOT_OWNER_IDS` at runtime rather than only at command load
- Guild-only enforcement moved to the command runner — commands with `guildOnly: true` are rejected before `run()` is ever called, preventing accidental DM execution
- Interaction deduplication — duplicate interaction IDs (same `id` received twice within 500 ms) are silently ignored to prevent double-execution on network retries
- Rate-limit store (`src/structures/RateLimitStore.ts`) — in-memory sliding-window rate limiter applied globally before cooldown checks; default 10 interactions per user per 10 seconds; configurable per command

#### Configuration
- `src/utils/validateEnv.ts` — called at boot; validates all required keys (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `MONGODB_URI`, `BOT_OWNER_IDS`) and optional keys (`OPENAI_API_KEY`, `LAVALINK_HOST`, etc.); prints a clear table of present/missing variables
- Runtime configuration reload — `config.json` is re-read from disk on every access via a thin cache with a 60 s TTL, meaning most config changes take effect without a restart
- Feature flags object in `config.json` (`features`) — boolean flags for `economy`, `leveling`, `music`, `ai`, `giveaways`, `tickets`; disabling a flag skips loading all commands in that category at startup

#### Database
- Connection pooling — Mongoose connection options set to `maxPoolSize: 10`, `minPoolSize: 2`, `socketTimeoutMS: 45000`, `serverSelectionTimeoutMS: 5000`
- Automatic reconnect — `bufferCommands: false`; reconnect logic retries with exponential backoff (1 s → 2 s → 4 s → 8 s → max 30 s)
- Query result caching — a lightweight in-memory TTL cache (`src/structures/QueryCache.ts`) wraps frequent read-only queries (guild config, user profile) with a 30 s TTL; cache is invalidated on write
- Index audit — all Mongoose schemas reviewed; added compound indexes for `(guildId, userId)` on UserModel and `(guildId, caseId)` on ModCaseModel to speed up the most frequent query patterns
- Health monitoring — `db.admin().ping()` integrated into the monitoring subsystem (see above)

#### Developer Experience
- All `as any` casts replaced with proper typed interfaces in `src/structures/types.ts`
- `RunContext` type extended with `isMobileUser()` helper (heuristic based on client type), `isOwner()` helper, `isPremium()` helper, and `hasCooldown(name)` helper
- JSDoc comments added to all exported functions in `src/utils/`
- `src/structures/types.ts` — new interfaces: `MonitoringStats`, `StartupResult`, `ValidationResult`, `RateLimitEntry`, `CacheEntry<T>`, `ComponentInteractionContext`
- `pnpm run typecheck` now runs with `--strict` and `--noUncheckedIndexedAccess` flags

#### Slash Commands
- Autocomplete handlers added for all commands that accept a dynamic string option: `play`, `search`, `radio`, `filter`, `job apply`, `job resign`, `shop buy`, `shop sell`, `auction end`, `giveaway end/reroll/edit/delete/pause/resume`, `warningtemplate use`, `savedqueue load/delete`, `selfrole get/drop`, `ticket add/remove`
- All slash command `description` fields capped at 100 characters and rewritten to start with a verb
- All slash option `description` fields filled in (previously several were empty strings)
- Localization keys added as `nameLocalizations` and `descriptionLocalizations` stubs for `en-US` and `fil` on every command — ready for full translation without a code change

---

### Changed

- All commands migrated from direct `successEmbed`/`errorEmbed`/`infoEmbed`/`warningEmbed` imports to `EmbedFactory` — visual output is identical, internal source is unified
- Logger calls across all commands updated to use the new structured pipeline (category, guild, user fields) instead of raw `console.log`
- Cooldown enforcement moved entirely into the command runner middleware — individual commands no longer need to call `checkCooldown`/`setCooldown` manually
- `src/index.ts` startup sequence refactored: validation → DB connect → command load → event load → Discord login, with timing logged at each step
- Command loader now skips non-`.ts`/`.js` files silently instead of throwing on unexpected files in the commands directory
- `config.json` — added `features` flag object and `monitoring` section with configurable thresholds for memory, CPU, ping, and cache size warnings

---

### Fixed

- Interaction replies sent after a collector timeout no longer throw `InteractionAlreadyReplied` — all collectors now check `interaction.replied` before attempting a followUp
- `help` command no longer crashes when a command has no `aliases` field (treated as empty array)
- Economy and leveling event multipliers now stack correctly when both are active simultaneously (previously the last one to be set overwrote the other)

---

## [0.1.6] — 2026-07-19

### Summary

Patch update focused on code quality, deduplication, and feature completion. All duplicate command files have been identified and resolved — 17 conflicting command names were cleaned up, with the higher-quality or more semantically correct implementation retained in each case. All command descriptions and user-facing strings have been translated to English (bot responses remain language-configurable via `/language`). The Help system has been completely overhauled with an interactive category navigator, fuzzy search, alias matching, paginated command listings, detailed per-command info pages, and session-based recently-viewed tracking. New commands added: `emoji` (add/delete/rename/list/info), `sticker` (add/delete/rename/list/info). The `antinuke` command has been expanded with `threshold`, `punishment`, and `logs` subcommands. The `automod` command now includes direct toggle subcommands for all 17 protection features (antispam, antiraid, antilink, antiinvite, antimention, antinsfw, antiscam, antitoxicity, antialt, antibot, antiflood, antimassjoin, antighostping). Music player mute/unmute commands have been renamed to `musicmute`/`musicunmute` to avoid collision with the moderation `mute`/`unmute` commands.

---

### Added

#### Admin — New Commands (2 new commands)
- `emoji add/delete/rename/list/info` — Full emoji management: add emojis from URLs, delete, rename, list all server emojis with pagination, and view individual emoji details; requires `ManageGuildExpressions`; checks server emoji limit before adding; supports both slash and prefix invocation
- `sticker add/delete/rename/list/info` — Full sticker management: add stickers from URLs with emoji tag, delete, rename, list with format type, and view individual sticker details; requires `ManageGuildExpressions`; checks server sticker limit before adding

#### Admin — Anti-Nuke Expansion
- `antinuke threshold [action] [count]` — Set per-action-type detection threshold (channelDelete, channelCreate, ban, kick, roleDelete, webhookCreate, or global); stores thresholds as named keys in `antinuke.thresholds`; accepts window parameter to override detection window
- `antinuke punishment [action]` — Standalone subcommand to set the anti-nuke punishment (ban/kick/strip-roles) independently of enable
- `antinuke logs [limit]` — View recent anti-nuke incident log entries stored in `antinuke.incidentLog`; paginated up to 20 entries; shows user, action type, punishment applied, action count, and relative timestamp

#### Moderation — Automod Expansion (13 new toggle subcommands)
- `automod antispam [on/off]` ⭐ — Directly toggle anti-spam protection
- `automod antiraid [on/off]` ⭐ — Directly toggle anti-raid protection
- `automod antilink [on/off]` — Directly toggle anti-link protection
- `automod antiinvite [on/off]` — Directly toggle Discord invite blocking
- `automod antimention [count]` — Set max mentions per message (0 = disable)
- `automod antinsfw [on/off]` ⭐ — Directly toggle AI NSFW detection
- `automod antiscam [on/off]` ⭐ — Directly toggle AI scam/phishing detection
- `automod antitoxicity [on/off]` ⭐ — Directly toggle AI toxicity filter
- `automod antialt [on/off]` ⭐ — Directly toggle alt-account blocking
- `automod antibot [on/off]` — Directly toggle unauthorized bot blocking
- `automod antiflood [on/off]` — Directly toggle message flood protection
- `automod antimassjoin [on/off]` ⭐ — Directly toggle mass-join raid detection
- `automod antighostping [on/off]` — Directly toggle ghost-ping detection and logging
- `automod config` — View full automod configuration (alias for `automod status`)

#### General — Help System Overhaul
- Interactive category navigation via `StringSelectMenu` with 60-second timeout
- Paginated command listing (15 per page) with prev/next buttons and back-to-overview button
- Fuzzy command search via Levenshtein distance — matches command names, aliases, description keywords, and category names; accessible via `/help search [query]`
- Full command detail page showing: description, category, access tier, premium flag, guild-only flag, cooldown, aliases, required permissions, and usage examples
- Session-based recently-viewed command tracking (last 5) shown on command detail pages
- Automatic fallback: unknown query triggers fuzzy search instead of a generic "not found" error
- Prefix-command users receive static embed overview; slash users get the full interactive experience

---

### Changed

#### Duplicate Command Resolution (17 conflicts fixed)
- Removed `src/commands/admin/djrole.ts` — `djrole` kept in `music/` where it semantically belongs
- Removed `src/commands/admin/language.ts` — richer `settings/language.ts` retained
- Removed `src/commands/admin/levelSet.ts` — `leveling/levelSet.ts` retained
- Removed `src/commands/admin/prefix.ts` — `settings/prefix.ts` retained
- Removed `src/commands/admin/reset.ts` — English `settings/reset.ts` retained
- Removed `src/commands/games/blackjack.ts` — economy version with wagering retained
- Removed `src/commands/games/coinflip.ts` and `utility/coinflip.ts` — economy version retained
- Removed `src/commands/games/dice.ts` — economy version retained
- Removed `src/commands/games/roulette.ts` — economy version retained
- Removed `src/commands/games/choose.ts` — `utility/choose.ts` retained
- Removed `src/commands/games/eightball.ts` — `utility/8ball.ts` retained
- Removed `src/commands/utility/connect4.ts` — `games/connect4.ts` retained
- Removed `src/commands/utility/hangman.ts` — `games/hangman.ts` retained
- Removed `src/commands/utility/neverhaveiever.ts` — `games/neverhaveiever.ts` retained
- Removed `src/commands/utility/translate.ts` — AI-powered `ai/translate.ts` retained
- Removed `src/commands/settings/help.ts` — `general/help.ts` retained (and overhauled)
- Removed `src/commands/settings/view.ts` — name conflict with `settings/settings.ts` resolved
- Removed `src/commands/moderation/clear.ts` — "alias for purge" removed; `music/clear.ts` (queue clear) retained
- Renamed `music/volumeMute.ts` command name: `mute` → `musicmute` (aliases: `volumemute`) to prevent collision with moderation `mute`
- Renamed `music/volumeUnmute.ts` command name: `unmute` → `musicunmute` (aliases: `volumeunmute`) to prevent collision with moderation `unmute`
- Renamed `ai/stats.ts` command name: `stats` → `aistats` to prevent collision with `settings/stats.ts`
- Renamed `economy/leaderboard.ts` command name: `leaderboard` → `economyleaderboard` to prevent collision with `leveling/leaderboard.ts` (XP-based)

#### English Localization
- Fixed 42 command files that contained Filipino-language descriptions, slash option labels, and error messages — all now use English by default
- Server language preference (English/Filipino) remains fully configurable via `/language`
- Internal automod admin messages, channel management responses, and various moderation replies translated

#### Descriptions & Metadata
- `ping` — updated description to reflect database status check feature
- `help` — completely new description reflecting the overhauled system
- `antinuke` — updated description to reflect all available subcommands
- `automod` — updated description to list all 17 protection features
- `channel` — updated description and all slash option labels to English

---

### Fixed
- Category casing inconsistency: all command `category` fields now use correct title case (e.g. `"owner"` → `"Owner"`, `"utility"` → `"Utility"`)
- `automodadmin muteduration` handler had a typo in the subcommand string check (`muteuration`) — command now matches correctly
- Help command now handles DM-only invocation gracefully (interactive components disabled, static embed returned)
- `antinuke whitelist` subcommand now uses proper mention format in success messages

---

## [0.1.5] — 2026-07-19

### Summary

Complete implementation of all remaining missing features from the official documentation spec. This patch adds the full Role Management command suite (select roles, color roles, self-assignable roles, notification roles, giverole), eight missing moderation commands (warnlist, kicklist, recentactions, unmuteallmembers, altcheck, spamcheck, similaraccounts, escalation, appealticket), and thirteen new admin commands (adminrole, djrole, muterole set/view, warningtemplate, bulkroleaudit, modrotation, boostperks, xpboost, economyevent, joingate, rolehierarchy, serverinsights, vanityurl, servertemplate, serverbackup). The `guildMemberAdd` event now enforces the Join Gate (minimum account age, anti-alt protection). Guild schema extended with new embedded documents for all new features.

---

### Added

#### Roles — New Commands (5 new commands)
- `selectrole create/addoption/removeoption/delete/list` — Create dropdown (StringSelectMenu) role selector panels; members pick roles via the menu (toggle on/off); up to 25 options per panel; premium-gated; component handler registered at startup
- `colorrole setup/add/remove/list/disable` — Color role picker: members choose their name color from a dropdown; admins configure available color roles; auto-updates the select menu whenever roles are added/removed; premium-gated; component handler registered at startup
- `selfrole add/remove/list/get/drop` — Self-assignable roles: admins whitelist roles, members pick them up with `/selfrole get` and drop with `/selfrole drop`; no mod involvement needed; stored in Guild document as `selfRoleIds` array
- `notificationrole add/remove/list` — Link roles to event types (giveaway, announcement, update, event, stream, poll, maintenance) so admins can identify which role to ping; pairs with `/selfrole` for self-subscription workflows
- `giverole [user] [role] [duration]` — Give a member a role temporarily (auto-removed by the existing tempban/role scheduler); duration is optional — omitting it makes the assignment permanent; stored in `TempRoleModel`

#### Moderation — New Commands (9 new commands)
- `warnlist [page]` — List all members with active warnings in the server, grouped by user and sorted by warning count; paginated at 10 per page
- `kicklist [limit]` — List the most recently kicked members with case IDs, timestamps, and moderator info; up to 20 entries
- `recentactions [limit] [type]` — View the most recent moderation actions across all types (or filtered); includes emoji type indicators and relative timestamps
- `unmuteallmembers [reason]` — Remove active Discord timeouts from every currently timed-out member in the server; fetches full member list, reports success/failure counts; 30-second cooldown to prevent abuse
- `altcheck [user]` — Heuristic alt account detection: checks account age, avatar presence, join recency, and outputs a risk level (Low/Moderate/Medium/High) with indicator list
- `spamcheck [user]` — Spam probability analysis using 30-day moderation history (warn count, mute count, automod hits) combined with account age heuristics; outputs verdict and indicator breakdown
- `similaraccounts [user] [similarity]` — Find members with similar usernames or join patterns to a target user; configurable similarity threshold (default 0.6); useful for detecting alt clusters
- `escalation [user]` — View the current escalation stage of a user based on their active warning count; displays the escalation ladder from `config.json` with current position highlighted
- `appealticket setup/list/approve/deny/submit` — Full ban/mute appeal workflow: admins configure a channel, members submit appeals with optional case ID, staff review with approve (auto-unmute/unban) or deny (with reason); DMs user on decision; logs to guild log channel

#### Admin — New Commands (15 new commands)
- `adminrole add/remove/list` — Manage roles that grant admin-level bot access (alternative to requiring the Discord Administrator permission)
- `djrole add/remove/list` — Manage DJ roles that control music playback access; pairs with the music command access checks
- `muterole set/create/sync/view` — Set an existing role as the mute role, create one automatically with correct channel permissions, or sync permission overwrites across all text channels; complement to the existing `muterolecreate` and `muterolesync` commands
- `warningtemplate add/use/list/delete` — Create reusable warning reason templates for efficient moderation; `/warningtemplate use [name] [user]` warns the member using the saved reason, logs to mod case, sends DM, and fires the log event
- `bulkroleaudit` — Audit all non-managed, non-empty roles for dangerous permission combinations; color-coded risk levels (🚨 Administrator, 🔴 High, 🟠 Moderate, 🟡 Low); lists safe roles separately
- `modrotation setup/view/disable` — Configure a rotating moderation shift schedule (daily/weekly/bi-weekly); tracks current on-duty moderator, last rotation timestamp, and optional announcement channel; stored in Guild document
- `boostperks setup/list/remove` — Configure roles automatically given to server boosters; pairs with the `guildMemberUpdate` boost detection event
- `xpboost start/stop/status` — Start a temporary XP multiplier event (1.1x–10x) with configurable duration; stored in `xpBoostEvent` Guild subdocument; premium-gated
- `economyevent start/stop/status` — Start a temporary economy bonus event (double coins, triple coins, double loot, bonus daily, lucky drop) with configurable duration; stored in `economyEvent` Guild subdocument; premium-gated
- `joingate setup/disable/status` — Block accounts below a minimum age (1–365 days) from joining the server (anti-alt); auto-kicks with a configurable DM message; premium-gated; enforced live in `guildMemberAdd` event
- `rolehierarchy` — Display a formatted role hierarchy table with permission risk indicators (🔴 Admin, 🟡 Mod perms, 🤖 Managed), hex colors, and member counts
- `serverinsights` — Rich server statistics embed: member breakdown (humans/bots/online/boosters), channel breakdown (text/voice/categories/threads), content counts, 30-day moderation case count, economy profile count, active giveaways, and server age
- `vanityurl set/view/remove` — Set or remove a custom bot vanity URL code for the server (used by the REST API and dashboard links); stored as `vanityUrlCode` in Guild document
- `servertemplate save/apply/list/delete` — Snapshot server role and channel structure as a named template; lists templates with captured metadata; apply shows a comparison guide; premium-gated
- `serverbackup create/list/info/delete` — Full server configuration backup (roles, channels, bot config snapshot); up to 5 backups per server; stores in `ServerBackupModel`; premium-gated

#### Infrastructure
- `guildMemberAdd` event — Join Gate enforcement: when `joinGate.enabled` is true, new members with accounts below `minAccountAgeDays` are DM'd a configurable message and kicked immediately; account age derived from snowflake ID (no additional API calls)

---

## [0.1.4] — 2026-07-17

Initial feature-complete baseline with modular command architecture, MongoDB schema, Lavalink music integration, economy system, leveling, giveaways, reaction roles, tickets, verification, and welcome system.
