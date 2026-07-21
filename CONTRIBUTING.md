# 🤝 Contributing to Panindigan Official

> *"Ito ay isang bukas na proyekto para sa komunidad. Bawat kontribusyon ay mahalaga."*

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Codebase Structure](#-codebase-structure)
3. [Code Style Guidelines](#-code-style-guidelines)
4. [Adding a New Command](#-adding-a-new-command)
5. [Testing Requirements](#-testing-requirements)
6. [PR Process](#-pr-process--review-standards)
7. [Bug Report Template](#-bug-report-template)
8. [Feature Request Template](#-feature-request-template)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 24.0.0
- **pnpm** ≥ 11.15.0
- **MongoDB Atlas** account (or local MongoDB)
- **Discord Bot Token** (from [Discord Developer Portal](https://discord.com/developers/applications))
- Optional: **Lavalink** server for music features
- Optional: **OpenAI API key** for AI features

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/panindigan/panindigan-official.git
cd panindigan-official

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env
# Edit .env and fill in your credentials

# 4. Start in development mode (hot-reload)
pnpm dev

# 5. Deploy slash commands (run once, or when commands change)
pnpm deploy-commands
```

### Environment Variables

See `.env.example` for all required and optional variables. **Never commit `.env`.**

Non-sensitive bot configuration (colors, limits, tier pricing) lives in `config.json`.

---

## 📁 Codebase Structure

```
src/
├── commands/            # 🎯 Command files, organized by category
│   ├── admin/           #    Admin & server management commands
│   ├── ai/              #    AI-powered commands (OpenAI)
│   ├── economy/         #    Economy system commands
│   ├── games/           #    Fun & game commands
│   ├── general/         #    General utility commands (help, ping, etc.)
│   ├── giveaways/       #    Giveaway management commands
│   ├── leveling/        #    XP & leveling commands
│   ├── logging/         #    Logging configuration commands
│   ├── moderation/      #    Moderation commands (ban, kick, etc.)
│   ├── music/           #    Music playback commands
│   ├── owner/           #    Bot owner-only commands
│   ├── roles/           #    Role management commands
│   ├── scheduler/       #    Reminder & scheduler commands
│   ├── settings/        #    Per-guild settings commands
│   ├── tickets/         #    Ticket system commands
│   ├── utility/         #    Utility commands (userinfo, ping, etc.)
│   ├── verification/    #    Verification system commands
│   └── welcome/         #    Welcome/goodbye configuration commands
│
├── config/              # ⚙️ Runtime-reloadable config loader
├── constants/           # 🔢 All magic numbers, limits, and design tokens
├── database/            # 🗄️ MongoDB models and connection
├── features/            # 🧩 Complex feature logic (music, scheduler, leveling)
├── handlers/            # 📡 Command and event dispatching
├── lib/                 # 📚 Core utilities (errors, retry, etc.)
├── managers/            # 👔 Collector and resource managers
├── repositories/        # 📦 Data access layer (Guild, User)
├── services/            # 🔧 Business logic services
├── structures/          # 🏗️ Core classes (Client, EmbedFactory, Monitor, etc.)
├── types/               # 📋 TypeScript types and DTOs
├── utils/               # 🛠️ Utility functions
└── validators/          # ✅ Input validation utilities
```

---

## ✏️ Code Style Guidelines

### TypeScript

- **Strict mode only** — `strict: true` is enforced via `tsconfig.json`
- **No `any`** — use proper types or `unknown`
- **Descriptive names** — `camelCase` for variables/functions, `PascalCase` for classes/interfaces, `SCREAMING_SNAKE_CASE` for constants

### Naming Conventions

```typescript
// Variables & functions — camelCase
const guildId = "123456789";
function formatUptime(seconds: number): string { ... }

// Classes & interfaces — PascalCase
class EmbedFactory { ... }
interface CommandDefinition { ... }

// Constants — SCREAMING_SNAKE_CASE
const MAX_QUEUE_SIZE = 500;
const BOT_VERSION = "0.2.6";
```

### Imports

```typescript
// Group imports: external → internal (constants → types → utils → specific)
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

import type { CommandDefinition } from "../../structures/types.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { COLORS, BOT_VERSION } from "../../constants/index.js";
```

### Comments

- Focus on **why**, not **what** — the code should be self-explanatory
- No obvious comments like `// increment counter`
- Do comment non-obvious business rules and gotchas

```typescript
// Good: Explains WHY
// Lavalink requires a 50ms delay between track skip and next play
// to avoid a race condition in the node's event queue
await sleep(50);

// Bad: Explains WHAT (obvious from code)
// Add track to queue
player.queue.add(track);
```

---

## ➕ Adding a New Command

Every command follows the `CommandDefinition` interface (`src/structures/types.ts`).

### 1. Create the file

Place it in the appropriate category folder under `src/commands/[category]/[commandName].ts`.

### 2. Follow the template

```typescript
import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { EmbedFactory } from "../../structures/EmbedFactory.js";

const command: CommandDefinition = {
  // ── Identity ──────────────────────────────────────────────────────────────
  name:        "commandname",       // lowercase, no spaces
  description: "Clear, helpful description of what the command does",
  category:    "General",           // must match existing category folder name
  access:      "general",           // owner | coowner | admin | moderator | general

  // ── Options ───────────────────────────────────────────────────────────────
  guildOnly:          true,         // false if DM-compatible
  premium:            false,        // true if Premium-only
  cooldown:           5,            // seconds; omit for default (3s)
  aliases:            ["alias1"],   // prefix command aliases
  memberPermissions:  ["ManageMessages"],  // optional Discord perms
  botPermissions:     ["SendMessages"],    // optional bot perms

  // ── Slash command data ────────────────────────────────────────────────────
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("option")
         .setDescription("Option description")
         .setRequired(true),
      ),

  // ── Command logic ─────────────────────────────────────────────────────────
  async execute(ctx) {
    // Always show loading state for slow commands
    if (ctx.isSlash) await ctx.interaction!.deferReply();

    // Get input
    const option = ctx.isSlash
      ? ctx.interaction!.options.getString("option", true)
      : ctx.args.join(" ");

    // Validate input
    if (!option.trim()) {
      await ctx.reply({
        embeds: [EmbedFactory.error("Kailangan ng valid na input.")],
        ephemeral: true,
      });
      return;
    }

    // Core logic
    // ...

    // Reply with Filipino-warm tone
    await ctx.reply({
      embeds: [EmbedFactory.success("Natapos na! 🎉", "✅ Command Name")],
    });
  },
};

export default command;
```

### 3. Checklist before submitting

- [ ] Uses `EmbedFactory` for all embeds (no raw `EmbedBuilder`)
- [ ] Has Filipino-warm error messages (not generic English errors)
- [ ] Has `try/catch` for all async operations
- [ ] Has proper permission checks (`memberPermissions`, `botPermissions`)
- [ ] Has `cooldown` set appropriately
- [ ] Has `guildOnly` set correctly
- [ ] Shows loading state for operations > 1 second
- [ ] No TODO comments or placeholder values
- [ ] No `console.log` (use `scopedLogger`)
- [ ] Imports only what is needed (no unused imports)

---

## 🧪 Testing Requirements

Before submitting a PR, verify:

1. **TypeScript check passes**: `pnpm typecheck`
2. **Build succeeds**: `pnpm build`
3. **Command loads**: Start the bot in dev mode and verify the command appears in `/help`
4. **Happy path**: Test the primary use case
5. **Error paths**: Test invalid inputs, missing permissions, etc.
6. **Both invocation modes**: Test as both `/slash` and `P!prefix` if applicable

---

## 🔄 PR Process & Review Standards

### Branch Naming

```
feat/command-name          # New command or feature
fix/bug-description        # Bug fix
chore/description          # Maintenance, refactoring
docs/description           # Documentation only
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(music): add vote-to-skip command
fix(help): resolve collector leak on timeout
chore(deps): update discord.js to v14.27
docs(brand): update color palette reference
```

### PR Description Template

```markdown
## Summary
Brief description of the change.

## Type of Change
- [ ] 🆕 New command/feature
- [ ] 🐛 Bug fix
- [ ] 🔨 Refactoring
- [ ] 📝 Documentation

## Testing Done
- [ ] TypeScript check: `pnpm typecheck`
- [ ] Build: `pnpm build`
- [ ] Manual testing: [describe what you tested]

## Screenshots (for UI/embed changes)
[attach screenshots of embeds/responses]
```

### Review Criteria

| ✅ Accept | ❌ Request Changes |
|-----------|-------------------|
| Follows `CommandDefinition` interface | Missing type annotations |
| Uses `EmbedFactory` | Raw `EmbedBuilder` usage |
| Filipino-warm tone | Generic English errors |
| Has error handling | Silent catch blocks |
| No `any` types | Unsafe type assertions |
| Consistent with design system | Off-brand colors/formatting |

---

## 🐛 Bug Report Template

```markdown
**Bot Version:** v0.2.6
**Command:** /commandname
**Server ID:** (optional, for server-specific bugs)

## Description
Clear description of the bug.

## Steps to Reproduce
1. Run `/commandname [args]`
2. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens. Include error message if any.

## Screenshots
[attach if applicable]
```

---

## ✨ Feature Request Template

```markdown
**Feature:** Brief feature name

## Description
Clear description of the feature.

## Use Case
Why is this feature needed? Who benefits from it?

## Proposed Implementation
(Optional) Any ideas on how to implement this.

## Priority
- [ ] 🔴 Critical — bot is broken without this
- [ ] 🟡 High — significantly improves user experience
- [ ] 🟢 Normal — nice to have
- [ ] ⚪ Low — minor improvement
```

---

## 📜 License

By contributing to Panindigan Official, you agree that your contributions will be licensed under the MIT License.

---

*Panindigan Official · v0.2.6 · Made with ❤️ for Filipino Discord Communities*
