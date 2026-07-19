---
name: 0.1.7 implementation status
description: What was implemented in the 0.1.7 quality/infrastructure release, what was deferred, and key decisions
---

## Done

- **EmbedFactory** (`src/structures/EmbedFactory.ts`) — 8 typed variants; `src/utils/embeds.ts` keeps backward-compatible aliases
- **Sanitize** (`src/utils/sanitize.ts`) — strips zero-width chars, control chars, truncates at 1000 chars
- **RateLimitStore** (`src/structures/RateLimitStore.ts`) — sliding-window rate limiter (10/10s), global prune
- **Builders** (`src/structures/builders/`) — button, select, modal factory helpers
- **Monitor** (`src/structures/Monitor.ts`) — memory, CPU (5-sample rolling), ping, DB, cache, shards polling
- **QueryCache** (`src/structures/QueryCache.ts`) — re-exports botCache/CACHE_TTL under named aliases
- **Logger** (`src/utils/logger.ts`) — 10 category helpers: [CMD] [DB] [API] [PERF] [START] [EVENT] [INTERACTION] [SECURITY] + colored console
- **Config** (`src/config/config.ts`) — AppConfig typed interface; runtime reload with 60s TTL via `getConfig()`; `isFeatureEnabled()` for feature flags; feature flags wired into command loader
- **Database** (`src/database/connection.ts`) — pool (max 10, min 2), exponential backoff retry, auto-reconnect, `pingDatabase()`
- **UserModel** — compound index `{ "guilds.guildId": 1, userId: 1 }`
- **Moderation models** — compound indexes already existed
- **interactionCreate.ts** — dedup guard (500ms), global rate-limit gate, 14.5s timeout recovery
- **commandHandler.ts** — feature flag gate per category; hit counter (`hitCounter` Map, `topCommands()` exported); EmbedFactory; sanitizeArgs; slow-command SLOW flag (>3s)
- **messageCreate.ts** — prefix cached via botCache; `isOwner`/`isPremium`/`isMobileUser`/`hasCooldown` on RunContext
- **types.ts** — RunContext extended with `isMobileUser()`, `hasCooldown()`, `isPremium()`, `isOwner()`; new interfaces for monitoring, startup, cache, rate-limit, component interaction
- **help.ts** — permission indicators (user + bot), bot perms field, smart search suggestions (3-button row on no results), jump-to-first/last pagination, frequently-used section from hitCounter, component ID v1 suffix
- **Autocomplete** added to: `play` (lavalink search), `savedqueueload`, `savedqueuedelete` (DB query), `giveaway` (end/reroll/delete/pause/resume — active giveaway IDs)
- **ai.ts** — all OpenAI calls wrapped in try/catch; `describeOpenAiError()` maps quota/rate/safety/timeout errors to user-friendly messages; `apiLog` category used for all API events
- **eventHandler.ts** — specific validation log per failure type (no default export, missing name, missing execute)
- **config.json** — features flags + monitoring thresholds sections added

## Deferred / Not Yet Implemented

- Autocomplete for: `warningtemplate use`, `selfrole get/drop`, `ticket add/remove` — need to read those specific command files; low risk of being used before implemented
- Autocomplete for shop buy/sell — those commands are stubs (shop system not yet fully built)
- JSDoc on all src/utils/ exports — mechanical, low priority
- Localization stubs (nameLocalizations/descriptionLocalizations) — requires touching every command file, no tooling to assist
- All commands migrated to structured logger pipeline (category fields) — many still use scopedLogger which is fine
- Auto-retry on Discord 429 — not implemented; discord.js handles most of this internally

## Key Decisions

**Why:** `AppConfig` typed interface added to config.ts so all `typeof config.colors` derivations work across EmbedFactory and embeds.ts; return type is `AppConfig` not `Record<string, unknown>`.

**Why:** `EventDefinition.execute` uses `any[]` args instead of typed generics to avoid contravariance failures when event files declare typed params (e.g., `ban: GuildBan`).

**Why:** `hitCounter` is in-memory only (no DB write). Per-session data only. If DB persistence is needed later, add a background flush to a GuildStats model.

**Why:** Autocomplete uses `setAutocomplete(true)` on the option; the `autocomplete` handler on CommandDefinition is routed from `interactionCreate.ts` when `interaction.isAutocomplete()`.

**Why:** Feature flag gate uses opt-out model — if a feature key is absent from config.json features object, it defaults to enabled. So `isFeatureEnabled("economy")` returns true if features.economy is missing.
