<div align="center">

# 🛡️ Panindigan Official

**v0.2.6 — Professional Modernization & Production Readiness**

**"Built like a flagship commercial product. Polished like a premium SaaS platform."**

[![Version](https://img.shields.io/badge/version-0.2.6-7C3AED?style=for-the-badge)](CHANGELOG.md)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-10B981?style=for-the-badge)](LICENSE)

*Enterprise-grade, modular, all-in-one Discord bot for Filipino communities.*

</div>

---

## 📋 Table of Contents

- [Vision](#-vision)
- [Features](#-features)
- [Design System](#-design-system)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Command Reference](#-command-reference)
- [Folder Structure](#-folder-structure)
- [Performance](#-performance)
- [Security](#-security)
- [Self-Healing](#-self-healing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔭 Vision

Ang **Panindigan Official** ay isang enterprise-grade SaaS Discord platform — hindi lang isang ordinaryong bot.

| Katangian | Pamantayan |
|-----------|------------|
| ⚡ Bilis | < 100ms response para sa lahat ng interaksyon |
| ✨ Brand | Agad na Panindigan-branded ang bawat embed |
| 🎯 Consistency | Bawat command, embed, at UI element ay nagkakaayon |
| 🏢 Scale | Daan-daang guilds nang walang degradasyon |
| 💎 Polish | Zero TODOs, zero placeholders, zero silent failures |

---

## ✨ Features

| Category | Count | Highlights |
|----------|-------|------------|
| 🛡️ **Moderation** | 45+ | Warn, ban, mute, timeout, antinuke, anti-raid, audit log |
| 🎫 **Tickets** | 20+ | Multi-panel, categories, transcript, SLA tracking |
| ✅ **Verification** | 8+ | Button, CAPTCHA, role gate, join gate |
| 📝 **Logging** | 15+ | Message edit/delete, voice, role, channel, member events |
| 🎵 **Music** | 30+ | Lavalink-powered, filters, lyrics, autoplay, queue history ⭐ |
| 📈 **Leveling** | 20+ | Rank, XP, leaderboard, prestige ⭐, level rewards, rank card ⭐ |
| 💰 **Economy** | 65+ | Balance, work, gambling, shop, pets, fishing, mining, farming, business, market |
| 🎮 **Games** | 34+ | Blackjack, poker, baccarat, roulette, bingo, sudoku, trivia, slots |
| 🎉 **Giveaways** | 13+ | Create, manage, reroll, bonus entries, requirements |
| 🔔 **Reaction Roles** | 16+ | Reaction, button, select, color, notification role menus |
| 🤖 **AI** | 22+ | Chat, translate, summarize, code, grammar, image gen, voice-to-text |
| ⏰ **Scheduler** | 21+ | Scheduled messages, recurring posts ⭐, birthdays, events ⭐ |
| 🛠️ **Utility** | 131+ | Userinfo, serverinfo, polls, embeds, weather, wikipedia, URL tools |
| 🎛️ **Settings** | 14+ | Prefix, language, premium, dashboard ⭐, help, changelog |
| 🎭 **Roles** | 7+ | Role management, self-assignable, color roles |

*⭐ = Premium feature*

---

## 🎨 Design System

### Design Tokens (v0.2.6)

| Token | Hex | Usage |
|-------|-----|-------|
| 🟣 Primary | `#7C3AED` | Brand headers, dashboard embeds |
| 🔵 Accent | `#3B82F6` | Interactive elements, info embeds |
| 🟢 Success | `#10B981` | Confirmations, OK states |
| 🟡 Warning | `#F59E0B` | Cautions, alerts, confirmations |
| 🔴 Error | `#EF4444` | Errors, destructive actions |
| ⚫ Surface | `#1E1E2E` | Loading states, neutral embeds |
| ✨ Premium | `#F1C40F` | Premium-gated feature notices |

### Status Indicators

| State | Emoji | Color |
|-------|-------|-------|
| Online/Active | 🟢 | Green |
| Loading | 🔵 | Blue |
| Warning | 🟡 | Yellow |
| Error/Down | 🔴 | Red |
| Disabled | ⚫ | Gray |
| Premium | ✨ | Gold |

### Animation Feel

Discord can't animate embeds — but Panindigan makes it feel like it can:

- ⏳ **Loading Embeds** — "Processing..." placeholder before the real answer
- 📝 **Staged Responses** — step-by-step reveal of information
- 🔄 **Progress Updates** — real-time progress bar in long operations
- ✏️ **Delayed Edits** — message edits that feel like transitions
- 💬 **Interaction Feedback** — instant acknowledgment of every action

---

## 🏗️ Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────┐
│                    DISCORD LAYER                      │
│          Commands • Events • Interactions             │
├─────────────────────────────────────────────────────┤
│                   HANDLER LAYER                       │
│      Handlers • Middlewares • Validators              │
├─────────────────────────────────────────────────────┤
│                   SERVICE LAYER                       │
│         Services • Managers • Builders                │
├─────────────────────────────────────────────────────┤
│                     DATA LAYER                        │
│    Repositories • DTOs • Transformers • Caches        │
├─────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                  │
│         Database • Cache • External APIs              │
└─────────────────────────────────────────────────────┘
```

### Pattern Glossary

| Pattern | Usage |
|---------|-------|
| 📦 Commands | User-facing command definitions |
| 📡 Events | Discord gateway event handlers |
| 🎛️ Handlers | Business logic controllers |
| 🏛️ Managers | Long-lived stateful services |
| ⚙️ Services | Business rule implementations |
| 🗂️ Repositories | Database access abstractions |
| ✅ Validators | Input validation + schema checks |
| 🔨 Builders | Embed + component constructors |
| 🔄 Transformers | Data shape converters |
| 📋 DTOs | Data transfer objects |
| 🔧 Utilities | Pure, reusable helper functions |
| 💉 Constants | Centralized magic numbers + limits |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB Atlas URI
- Discord bot token + application ID

### Installation

```bash
# Clone the repository
git clone https://github.com/panindigan/panindigan-official.git
cd panindigan-official

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Fill in .env with your secrets (see Environment Variables section)

# Build the bot
pnpm build

# Register slash commands globally
pnpm run deploy-commands

# Start in production
pnpm start
```

### Development

```bash
# Start with hot-reload (tsx watch)
pnpm dev
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Discord application/client ID |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `BOT_OWNER_IDS` | ✅ | Comma-separated Discord user IDs with owner access |
| `DISCORD_CLIENT_SECRET` | ⬜ | OAuth2 client secret (dashboard) |
| `LAVALINK_HOST` | ⬜ | Lavalink node host (music) |
| `LAVALINK_PORT` | ⬜ | Lavalink node port |
| `LAVALINK_PASSWORD` | ⬜ | Lavalink node password |
| `LAVALINK_SECURE` | ⬜ | `true` to use WSS (default: false) |
| `OPENAI_API_KEY` | ⬜ | OpenAI API key (AI commands) |
| `API_PORT` | ⬜ | REST API port (default: 3001) |
| `API_JWT_SECRET` | ⬜ | JWT secret for REST API |
| `SESSION_SECRET` | ⬜ | Session secret for dashboard |
| `NODE_ENV` | ⬜ | `development` or `production` |

> **Note:** Non-sensitive settings (prefix, colors, tier pricing, feature flags) live in `config.json`.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start in development mode with hot-reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled bot from `dist/` |
| `pnpm run deploy-commands` | Register slash commands globally |
| `pnpm run typecheck` | Type-check without emitting output |

---

## 📂 Folder Structure

```
src/
├── 📁 commands/           # Slash + prefix commands
│   ├── 📁 admin/
│   ├── 📁 ai/
│   ├── 📁 economy/
│   ├── 📁 games/
│   ├── 📁 general/
│   ├── 📁 giveaways/
│   ├── 📁 leveling/
│   ├── 📁 moderation/
│   ├── 📁 music/
│   ├── 📁 owner/
│   ├── 📁 reaction-roles/
│   ├── 📁 roles/
│   ├── 📁 scheduler/
│   ├── 📁 settings/
│   ├── 📁 tickets/
│   ├── 📁 utility/
│   └── 📁 verification/
├── 📁 events/             # Discord gateway events
├── 📁 handlers/           # Interaction + component handlers
├── 📁 services/           # Business logic services
├── 📁 repositories/       # Database access layer (v0.2.6)
├── 📁 builders/           # Embed + component builders (v0.2.6)
├── 📁 validators/         # Input validation (v0.2.6)
├── 📁 managers/           # Stateful managers (v0.2.6)
├── 📁 constants/          # Centralized constants (v0.2.6)
├── 📁 types/              # TypeScript DTOs + interfaces (v0.2.6)
├── 📁 lib/                # Shared internal libraries (v0.2.6)
├── 📁 structures/         # Core bot structures
├── 📁 features/           # Feature modules (music, AI, automod, etc.)
├── 📁 utils/              # Pure helper functions
├── 📁 config/             # Environment + feature config
├── 📁 database/           # MongoDB models + connection
└── 📁 api/                # REST API server
```

---

## 📊 Logging

### v0.2.6 Log Categories

| Category | Emoji | Color | Usage |
|----------|-------|-------|-------|
| `COMMAND` | 🟣 | Magenta | Command execution events |
| `EVENT` | 🔵 | Cyan | Discord gateway events |
| `DATABASE` | 🟢 | Green | Query latency, pool, errors |
| `VOICE` | 🟡 | Yellow | Lavalink, voice sessions |
| `ERROR` | 🔴 | Red | Application errors |
| `SECURITY` | 🟠 | Orange | Permission denials, rate limits |
| `PERFORMANCE` | ⚪ | White | Slow-operation diagnostics |
| `SYSTEM` | ⚫ | Gray | Startup/shutdown lifecycle |

### Structured Log Format

```json
{
  "timestamp": "2026-07-21T00:00:00.000Z",
  "level": "INFO",
  "category": "COMMAND",
  "guild_id": "123456789",
  "user_id": "987654321",
  "shard_id": 0,
  "command": "/play",
  "execution_time_ms": 42,
  "db_latency_ms": 8,
  "api_latency_ms": 31,
  "voice_latency_ms": 12,
  "memory_mb": 128,
  "cpu_percent": 2.4
}
```

---

## 🚀 Performance

### Benchmark Targets

| Metric | Target |
|--------|--------|
| Command Response Time | < 100ms |
| Error Rate | < 0.1% |
| Uptime | > 99.9% |
| Cache Hit Rate | > 85% |
| Memory Usage | < 512MB |

### Database Performance

| Operation | Target |
|-----------|--------|
| Simple SELECT (cache hit) | < 1ms |
| Simple SELECT (cache miss) | < 5ms |
| Complex query | < 20ms |
| Bulk INSERT (100 rows) | < 50ms |

---

## 🔐 Security

### Validation Layers

- 🔑 **Permission Validation** — role + permission check before every action
- 🎯 **Interaction Validation** — verified Discord-origin interactions only
- 🔘 **Button Validation** — owner-only component enforcement
- 📝 **Modal Validation** — input sanitization + schema validation
- 🏠 **Guild Isolation** — guild data never crosses boundaries

### Abuse Prevention

- ⏱️ Per-user + per-guild rate limiting
- 🚫 Pattern-based spam detection
- 🔇 Enforced command cooldowns
- @ Anti-mass-mention system
- 🔗 URL blocklist (grabify, iplogger, and more)
- 📎 Attachment type + size validation
- 🔒 XSS + injection prevention on all inputs

---

## 🩺 Self-Healing

| Failure | Recovery Action | Timeout |
|---------|----------------|---------|
| Database Disconnect | 🔁 Auto-reconnect + retry queue | 30s |
| Lavalink Node Down | 🔀 Failover to backup node | 10s |
| Voice Disconnect | 🔊 Rejoin + resume queue | 15s |
| Collector Timeout | 🔄 Restart with state restore | Immediate |
| REST Rate Limit | ⏳ Smart backoff + retry | Dynamic |
| Cache Corruption | 🗑️ Flush + warm-up | 5s |
| Scheduled Job Fail | 📅 Reschedule with backoff | 60s |

---

## 🎵 Music Experience

Powered by Lavalink with a fully rebuilt player:

| Feature | Detail |
|---------|--------|
| 🔄 Player Lifecycle | State machine: IDLE → PLAYING → PAUSED → STOPPED |
| 📋 Queue | Smart management with history + undo |
| 🎤 Lyrics | Real-time synced display in embed |
| 🎚️ Filters | 15+ audio filters with instant preview |
| 🤖 Autoplay | AI-powered recommendations |
| 📈 Progress Bar | Animated ASCII progress bar |
| 🎮 Controls | ⏮ ⏯ ⏭ 🔀 🔁 ❤️ 🔊 interactive buttons |
| 🔀 Node Failover | Auto-switch to backup Lavalink node |

---

## 🤖 AI Features

Requires `OPENAI_API_KEY`. Enables 22+ commands:

`chat` · `translate` · `summarize` · `code` · `codeexplain` · `grammar` · `rewrite` · `analyze` · `moderate` · `imagegen` · `voicetotext` · `texttoimage` · `autoresponse` · `faq` · `ticketassist` · `persona`

---

## ✅ Code Quality Standards

| Rule | Standard |
|------|----------|
| 🔷 TypeScript | Strict mode, zero `any` |
| 🚫 Type Assertions | No unsafe `as` casts |
| 📋 Duplication | Zero — all logic is reusable utilities |
| 🏷️ Naming | `PascalCase` classes, `camelCase` vars, `SCREAMING_SNAKE` constants |
| 📝 Documentation | JSDoc on all public functions + classes |
| 🧹 Dead Code | Zero — all code is used or removed |

### Principles

- 🧱 **SOLID** — single responsibility, open/closed, Liskov, interface segregation, DI
- 🔁 **DRY** — don't repeat yourself
- 💋 **KISS** — keep it simple
- 🏛️ **Clean Architecture** — dependency rule, separation of concerns
- 🌐 **Domain Separation** — Music ≠ Moderation ≠ Economy ≠ Utility

---

## 👥 Privacy

- 🚫 No data selling — server data stays yours
- 🗑️ Data deletion available on request
- 🔐 All credentials stored via environment variables, never in code
- 🛡️ Anti-nuke + global ban system for cross-server protection

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the command pattern: `@/structures/types` + `RunContext`
4. Follow naming conventions in `src/constants/index.ts`
5. Use `EmbedFactory` for all embeds (never raw `EmbedBuilder`)
6. Use `ErrorBuilder` for all error responses
7. Use `withRetry()` for all DB and API calls
8. Validate all user input with `src/validators/`
9. Open a pull request with a clear description

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

**🇵🇭 Made with ❤️ for Filipino communities**

*Panindigan — to stand up for, to defend, to champion.*

**Built to deliver a modern, polished, and production-ready Discord experience.**

</div>
