/**
 * EmbedFactory v0.2.6 — Unified design system for all bot embeds.
 *
 * v0.2.6 Design Language:
 *   Panindigan brand colors stay, status colors updated to Discord-standard palette.
 *
 * Status colors (v0.2.6):
 *   ✅ Success     #57F287  — Discord green
 *   ⚠️ Warning     #FEE75C  — Discord yellow
 *   ❌ Error       #ED4245  — Discord red
 *   ℹ️ Info        #5865F2  — Discord blurple
 *   ⏳ Loading     #95A5A6  — Gray
 *   👑 Premium     #F1C40F  — Gold
 *
 * Feature-specific embed colors (v0.2.6):
 *   🎵 Music       #9B59B6  — Purple
 *   🤖 AI          #1ABC9C  — Teal
 *   🔨 Moderation  #E67E22  — Orange
 *   👋 Welcome     #3498DB  — Sky
 *   🎫 Ticket      #5865F2  — Indigo
 *   📋 Logging     #2C3E50  — Dark
 *   📊 Statistics  #00BCD4  — Cyan
 *   📢 Announcement #E91E63 — Pink
 *
 * Footer standard (v0.2.6):
 *   "🤖 Panindigan Official · [relative timestamp]"
 *
 * Import EmbedFactory for all new code.
 * The helpers in utils/embeds.ts remain as backward-compatible aliases.
 */

import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { config } from "../config/config.js";
import { BOT_VERSION } from "../constants/index.js";

// ── Design tokens v0.2.6 ─────────────────────────────────────────────────────
const TOKENS = {
  // Brand
  primary:      "#7C3AED",
  accent:       "#5865F2",

  // Status (Discord-standard)
  success:      "#57F287",
  warning:      "#FEE75C",
  danger:       "#ED4245",
  error:        "#ED4245",
  info:         "#5865F2",
  loading:      "#95A5A6",
  surface:      "#95A5A6",   // alias for loading (backward-compat)

  // Feature-specific
  music:        "#9B59B6",
  ai:           "#1ABC9C",
  moderation:   "#E67E22",
  welcome:      "#3498DB",
  ticket:       "#5865F2",
  logging:      "#2C3E50",
  statistics:   "#00BCD4",
  premium:      "#F1C40F",
  gold:         "#F1C40F",
  announcement: "#E91E63",
} as const;

type TokenKey = keyof typeof TOKENS;
type ConfigColorKey = keyof typeof config.colors;

/** Resolve a token or config color to a hex string. */
function resolveColor(key: TokenKey | ConfigColorKey): string {
  if (key in TOKENS) return TOKENS[key as TokenKey];
  const c = config.colors[key as ConfigColorKey];
  return typeof c === "string" ? c : TOKENS.primary;
}

/** Base embed with timestamp + resolved color. */
function base(key: TokenKey | ConfigColorKey): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(resolveColor(key) as ColorResolvable)
    .setTimestamp();
}

// ── Footer helpers ─────────────────────────────────────────────────────────────
const BOT_ICON = "https://cdn.discordapp.com/embed/avatars/0.png";

/**
 * Standard Panindigan footer: "🤖 Panindigan Official · v0.2.6 | Shard N"
 * Pass `shardId` when available; omit for ephemeral/system embeds.
 */
function buildFooter(shardId?: number): { text: string; iconURL: string } {
  const shard = shardId !== undefined ? ` | Shard ${shardId}` : "";
  return {
    text:    `🤖 Panindigan Official · v${BOT_VERSION}${shard}`,
    iconURL: BOT_ICON,
  };
}

// ── Status indicator helpers ──────────────────────────────────────────────────
const STATUS = {
  online:   "🟢",
  loading:  "🔵",
  warning:  "🟡",
  error:    "🔴",
  disabled: "⚫",
  premium:  "✨",
  degraded: "🟠",
} as const;

// ── Main factory ─────────────────────────────────────────────────────────────
export class EmbedFactory {

  // ── Core status variants ──────────────────────────────────────────────────

  /** ✅ #57F287 — operation completed successfully. */
  static success(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("success")
      .setDescription(`✅ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** ❌ #ED4245 — something went wrong. */
  static error(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("danger")
      .setDescription(`❌ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** ⚠️ #FEE75C — non-fatal warning or notice. */
  static warning(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("warning")
      .setDescription(`⚠️ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** ℹ️ #5865F2 — neutral information or interactive context. */
  static info(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("info")
      .setDescription(`ℹ️ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** ⏳ #95A5A6 — background operation in progress (loading state). */
  static loading(description: string, title?: string): EmbedBuilder {
    const e = base("loading")
      .setDescription(`⏳ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ❓ #FEE75C — prompts a yes/no confirmation from the user. */
  static confirm(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("warning")
      .setDescription(`❓ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** ⭐ #F1C40F — premium-gated feature notice. */
  static premium(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("premium")
      .setDescription(`⭐ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** 🎛️ #7C3AED — dashboard or settings display. */
  static dashboard(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("primary")
      .setDescription(`🎛️ ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  // ── v0.2.6 Feature-specific embed types ──────────────────────────────────

  /** 🎵 #9B59B6 — music-related embeds. */
  static music(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("music")
      .setDescription(`🎵 ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /** 🤖 #1ABC9C — AI response embeds. */
  static ai(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("ai")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`🤖 ${title}`);
    return e;
  }

  /** 🔨 #E67E22 — moderation action embeds. */
  static moderation(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("moderation")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`🔨 ${title}`);
    return e;
  }

  /** 👋 #3498DB — welcome and join embeds. */
  static welcome(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("welcome")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`👋 ${title}`);
    return e;
  }

  /** 🎫 #5865F2 — ticket system embeds. */
  static ticket(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("ticket")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`🎫 ${title}`);
    return e;
  }

  /** 📋 #2C3E50 — audit log and event log embeds. */
  static logging(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("logging")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`📋 ${title}`);
    return e;
  }

  /** 📊 #00BCD4 — statistics and analytics embeds. */
  static statistics(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("statistics")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`📊 ${title}`);
    return e;
  }

  /** 📢 #E91E63 — announcement embeds. */
  static announcement(description: string, title?: string, shardId?: number): EmbedBuilder {
    const e = base("announcement")
      .setDescription(description)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(`📢 ${title}`);
    return e;
  }

  // ── Rich structured variants ───────────────────────────────────────────────

  /**
   * Rich error embed per v0.2.6 Error Experience spec.
   * Includes what happened, why, and how to fix.
   */
  static richError(options: {
    title: string;
    what: string;
    why?: string;
    fix?: string;
    command?: string;
    shardId?: number;
  }): EmbedBuilder {
    const e = base("danger")
      .setTitle(`❌ ${options.title}`)
      .setFooter(buildFooter(options.shardId));

    const fields: { name: string; value: string; inline: boolean }[] = [
      { name: "📄 Nangyari", value: options.what, inline: false },
    ];
    if (options.why)     fields.push({ name: "🤔 Bakit",          value: options.why,     inline: false });
    if (options.fix)     fields.push({ name: "🛠️ Paano Ayusin",   value: options.fix,     inline: false });
    if (options.command) fields.push({ name: "💡 Subukan Ito",    value: `\`${options.command}\``, inline: true });

    e.addFields(fields);
    return e;
  }

  /**
   * Staged loading embed — shows a "Processing…" placeholder
   * that can be edited with the real result once ready.
   */
  static staged(stage: "processing" | "fetching" | "generating" | "saving" | "connecting" | "searching"): EmbedBuilder {
    const labels: Record<string, string> = {
      processing:  "Pinoproseso ang iyong kahilingan…",
      fetching:    "Kinukuha ang data…",
      generating:  "Ginagawa ang sagot…",
      saving:      "Sine-save ang mga pagbabago…",
      connecting:  "Kumokonekta…",
      searching:   "Naghahanap…",
    };
    return base("loading")
      .setDescription(`⏳ ${labels[stage] ?? "Sandali lang…"}`);
  }

  /**
   * Status indicator embed — useful for health/diagnostics commands.
   * Picks the correct status emoji based on the given state.
   *
   * v0.2.6: Always uses BOTH icon AND text label for color-blind safety.
   */
  static status(
    state: keyof typeof STATUS,
    description: string,
    title?: string,
    shardId?: number,
  ): EmbedBuilder {
    const colorMap: Record<keyof typeof STATUS, TokenKey> = {
      online:   "success",
      loading:  "info",
      warning:  "warning",
      error:    "danger",
      disabled: "loading",
      premium:  "premium",
      degraded: "moderation",
    };
    const e = base(colorMap[state])
      .setDescription(`${STATUS[state]} ${description}`)
      .setFooter(buildFooter(shardId));
    if (title) e.setTitle(title);
    return e;
  }

  /**
   * Paginator header embed — used for paginated list commands.
   * Includes page N / total indicator in the footer.
   */
  static page(
    description: string,
    title: string,
    currentPage: number,
    totalPages: number,
    shardId?: number,
  ): EmbedBuilder {
    const shard = shardId !== undefined ? ` | Shard ${shardId}` : "";
    return base("primary")
      .setTitle(title)
      .setDescription(description)
      .setFooter({
        text:    `Page ${currentPage} / ${totalPages}  •  🤖 Panindigan v${BOT_VERSION}${shard}`,
        iconURL: BOT_ICON,
      });
  }

  /**
   * Author layout — sets a branded author row (icon + name + optional URL).
   * Call on any existing EmbedBuilder to apply the v0.2.6 author style.
   */
  static withAuthor(
    embed: EmbedBuilder,
    name: string,
    iconURL?: string,
    url?: string,
  ): EmbedBuilder {
    embed.setAuthor({ name, ...(iconURL ? { iconURL } : {}), ...(url ? { url } : {}) });
    return embed;
  }

  /**
   * Generic base embed — use when none of the typed variants fit.
   * Accepts a key from the v0.2.6 design token set or config.colors.
   */
  static base(color: TokenKey | ConfigColorKey = "primary"): EmbedBuilder {
    return base(color).setFooter(buildFooter());
  }

  /**
   * Help Center embed — branded dashboard style for the interactive help panel.
   */
  static helpDashboard(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(resolveColor("primary") as ColorResolvable)
      .setTitle(title)
      .setDescription(description)
      .setFooter({
        text:    `🤖 Panindigan Help Center · v${BOT_VERSION}`,
        iconURL: BOT_ICON,
      })
      .setTimestamp();
  }
}
