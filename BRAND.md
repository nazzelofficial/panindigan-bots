# 🪪 Panindigan Official — Brand Style Guide `v0.2.6`

> *"Hindi kopya ng MEE6, Dyno, Jockie, o kahit anong popular na bot. Panindigan ang sariling identity nito."*

---

## 🎨 Color Palette

### Brand Colors (always consistent)

| Role | Name | Hex | Discord Int | Usage |
|------|------|-----|------------|-------|
| 🟣 Brand | Primary Violet | `#7C3AED` | `8142061` | Headers, dashboards, main identity |
| 🔵 Interactive | Discord Blurple | `#5865F2` | `5793266` | Links, info, interactive elements |

### Status Colors (v0.2.6 — Discord-standard)

| Status | Name | Hex | Discord Int | Emoji | Usage |
|--------|------|-----|------------|-------|-------|
| ✅ Success | Discord Green | `#57F287` | `5759623` | ✅ | Confirmations, OK states |
| ⚠️ Warning | Discord Yellow | `#FEE75C` | `16737116` | ⚠️ | Cautions, alerts |
| ❌ Error | Discord Red | `#ED4245` | `15548997` | ❌ | Errors, destructive actions |
| ℹ️ Info | Discord Blurple | `#5865F2` | `5793266` | ℹ️ | Neutral information |
| ⏳ Loading | Gray | `#95A5A6` | `9807270` | ⏳ | Background/in-progress |
| 👑 Premium | Gold | `#F1C40F` | `15801359` | ⭐ | Premium-gated features |

### Feature-Specific Colors (v0.2.6)

| Feature | Color | Hex | Emoji |
|---------|-------|-----|-------|
| 🎵 Music | Purple | `#9B59B6` | 🎵 |
| 🤖 AI | Teal | `#1ABC9C` | 🤖 |
| 🔨 Moderation | Orange | `#E67E22` | 🔨 |
| 👋 Welcome | Sky Blue | `#3498DB` | 👋 |
| 🎫 Ticket | Indigo | `#5865F2` | 🎫 |
| 📋 Logging | Dark | `#2C3E50` | 📋 |
| 📊 Statistics | Cyan | `#00BCD4` | 📊 |
| 📢 Announcement | Pink | `#E91E63` | 📢 |

> 🚨 **Rule:** Huwag mag-improbisa ng colors per-command. Gamitin palagi ang tamang color mula sa `EmbedFactory` o `COLORS` constants.

---

## ✍️ Tone & Voice Guidelines

### Core Identity

Ang Panindigan ay **professional pero may Filipino warmth**. Hindi ito katulad ng mga western corporate bots na puro English at walang personya. Hindi rin ito basta-basta Filipino slang bot.

**Ang tono ay:**
- 🇵🇭 Filipino-informed — natural na paggamit ng Filipino expressions
- 👔 Professional — laging maayos ang grammar at wording
- 💛 Warm — hindi robotic, hindi malamig
- 💪 Confident — malinaw at direkta
- 😊 Friendly — parang kausap ang isang kaibigan na eksperto

### ✅ Ganitong Tono (Tamang Halimbawa)

```
✅ "Hindi ka pa naka-join sa voice channel. Subukan ulit pagkatapos mag-join! 🎵"
✅ "Sandali lang! Subukan ang /play muli pagkatapos ng 5 segundo. ⏱️"
✅ "Wala kang sapat na permiso para dito. Makipag-ugnayan sa iyong server admin."
✅ "May nangyaring mali sa aming panig, hindi sa iyo. Subukan ulit! 🙏"
✅ "Nai-save na ang iyong mga setting. ✅"
✅ "Kinukuha ang kasalukuyang queue… sandali lang."
```

### ❌ Iwasang Gawing Ganito (Mali)

```
❌ "Error: User not in voice channel."
❌ "You do not have permission to use this command."
❌ "An error occurred while processing your request."
❌ "Success."
❌ "Invalid input."
❌ "Error: COMMAND_FAILED"
```

---

## 📐 Embed Anatomy (v0.2.6 Standard)

```
┌─────────────────────────────────────────────────────┐
│  [Color strip based on embed type]                   │
│  ─────────────────────────────────────────────────── │
│  🔷  EMBED TITLE                          [Thumbnail] │
│  ─────────────────────────────────────────────────── │
│  📝 Description text                                  │
│     Clear, concise, Filipino-warm                    │
│                                                       │
│  🔹 Field Name          │  🔹 Field Name              │
│  Field value            │  Field value                │
│  ─────────────────────────────────────────────────── │
│  🤖 Panindigan Official · v0.2.6          [Timestamp] │
└─────────────────────────────────────────────────────┘
```

### Footer Standard (v0.2.6)

```
🤖 Panindigan Official · v0.2.6
🤖 Panindigan Official · v0.2.6 | Shard 0
🤖 Panindigan Help Center · v0.2.6
```

> 🚨 **Rule:** Palaging gumagamit ng `EmbedFactory` para sa lahat ng embeds. Huwag gumawa ng raw `new EmbedBuilder()` sa command files nang hindi gumagamit ng `EmbedFactory`.

---

## 🔘 Button Style Guide

| Action Type | Style | Example |
|-------------|-------|---------|
| Primary action | `ButtonStyle.Primary` (blurple) | "Subukan Ulit", "I-confirm", "Play" |
| Navigation | `ButtonStyle.Secondary` (gray) | "◀ Prev", "▶ Next", "🏠 Home" |
| Destructive | `ButtonStyle.Danger` (red) | "❌ I-delete", "🚫 I-ban", "❌ Close" |
| External link | `ButtonStyle.Link` | "🌐 Website", "📚 Docs", "🆘 Support" |
| Positive | `ButtonStyle.Success` (green) | "✅ Sang-ayon", "👍 Nakatulong" |

---

## 🎭 Icon Rules

### Category Icons (from `CATEGORY_ICONS` constants)

```
Admin:            ⚙️     AI:               🤖
Economy:          💰     Games:            🎮
General:          🏠     Giveaways:        🎉
Leveling:         📈     Logging:          📋
Moderation:       🛡️     Music:            🎵
Owner:            🔑     Reaction Roles:   🔔
Roles:            🎭     Scheduler:        ⏰
Settings:         🎛️     Tickets:          🎫
Utility:          🛠️     Verification:     ✅
Welcome:          👋
```

### Status Icons (always pair icon WITH text — color-blind safety)

```
✅ Operational   ⚠️ Degraded   ❌ Offline
🟢 Online        🟡 Warning    🔴 Error/Offline
⏳ Loading       🔵 Connecting  ⚫ Disabled
⭐ Premium       🔑 Owner       👑 Premium Status
```

> 🚨 **Rule (v0.2.6):** Huwag gumamit ng color alone para mag-indicate ng status. Palaging kasama ang icon O text label para sa accessibility.

---

## 🌑 Empty State Messages (Signature Panindigan Style)

```
✅ Good:
   "Walang nahanap para sa iyong query. Subukan ang ibang keyword! 🔍"
   "Walang items sa queue. Mag-queue ng kanta gamit ang /play! 🎵"
   "Wala ka pang earned badges. Simulan ang iyong paglalakbay! 🏆"

❌ Bad:
   "No results found."
   "Queue is empty."
   "No badges."
```

---

## ✅ Success/Error Phrasing (Signature Style)

### Success Messages

```
✅ "[Action] na! [Optional emoji related to action]"
✅ "Na-[verb] na ang [object]. [Friendly follow-up]"

Examples:
   "Naka-save na ang iyong mga setting. ✅"
   "Na-skip na ang kasalukuyang kanta. 🎵"
   "Nai-timeout na si [user] ng [duration]. 🔨"
```

### Error Messages

```
❌ "[Friendly explanation]. [How to fix]. [Optional emoji]"

Examples:
   "Hindi ka pa naka-join sa voice channel. Mag-join ka muna bago gamitin ang /play! 🎵"
   "Wala kang sapat na permiso para dito. Makipag-ugnayan sa iyong server admin. 🔐"
   "Ang /daily ay may 24-oras na cooldown. Subukan ulit bukas! 💰"
```

---

## 📖 SUMMARY: Quick Reference Card

```
DO:
  ✅ Gamitin ang EmbedFactory para sa lahat ng embeds
  ✅ Gamitin ang Filipino-warm na tone
  ✅ Palaging kasama ang icon AT text sa status indicators
  ✅ Consistent na footer: "🤖 Panindigan Official · v0.2.6"
  ✅ Palaging may "Paano Ayusin" sa error messages
  ✅ Gumamit ng CATEGORY_ICONS constants para sa icons
  ✅ Mag-import ng colors mula sa COLORS constants

DON'T:
  ❌ Huwag gumawa ng raw EmbedBuilder sa commands
  ❌ Huwag gumamit ng hard-coded hex colors
  ❌ Huwag mag-iwan ng "TODO", placeholder text, o mock data
  ❌ Huwag gumamit ng malamig na corporate tone
  ❌ Huwag mag-iwan ng silent failures — laging may error handling
  ❌ Huwag gumamit ng color alone para sa status (color-blind safety)
```

---

*Panindigan Official Brand Guide · v0.2.6 · Designed for Filipino Discord Communities*
