/**
 * builders/ErrorBuilder.ts v0.2.6
 * Error Experience — rich, actionable error embeds per the v0.2.6 spec.
 *
 * v0.2.6 Error Anatomy (every error embed contains):
 *   🔴  Error Title        — clear error name
 *   📄  Nangyari           — what happened (Filipino-warm)
 *   🤔  Bakit              — root cause
 *   🛠️  Paano Ayusin       — step-by-step solution
 *   💡  Subukan Ito        — command to try instead
 *   📚  Documentation Link — link to relevant docs
 *   🔁  Retry Button       — "Subukan Ulit" button
 *   🆘  Support Button     — direct link to support server
 *
 * v0.2.6 Tone guideline:
 *   ✅ "Hindi ka pa naka-join sa voice channel. Subukan ulit pagkatapos mag-join! 🎵"
 *   ❌ "Error: User not in voice channel."
 *
 * Error Types:
 *   ⚠️  User Error     — invalid input, missing permission
 *   🔴  Bot Error      — internal failure
 *   📡  API Error      — external service failure
 *   🗄️  Database Error — query failure
 *   ⏳  Rate Limit     — Discord API rate limit
 *   🔐  Permission     — missing bot or user permissions
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ColorResolvable,
} from "discord.js";
import { CUSTOM_ID, COLORS, BOT_VERSION } from "../constants/index.js";
import {
  isUserError,
  isApiError,
  isDatabaseError,
  isPanindiganError,
  PermissionError,
  CooldownError,
  PremiumRequiredError,
  RateLimitError,
  type PanindiganError,
} from "../lib/errors.js";

// ── Error type meta ───────────────────────────────────────────────────────────

const ERROR_META: Record<string, { emoji: string; label: string; color: number }> = {
  user:        { emoji: "⚠️",  label: "Mali ang Input",     color: COLORS.WARNING    },
  bot:         { emoji: "🔴",  label: "Internal Error",     color: COLORS.DANGER     },
  api:         { emoji: "📡",  label: "Service Error",      color: COLORS.INFO       },
  database:    { emoji: "🗄️",  label: "Database Error",     color: COLORS.DANGER     },
  ratelimit:   { emoji: "⏳",  label: "Rate Limite",        color: COLORS.WARNING    },
  permission:  { emoji: "🔐",  label: "Walang Permission",  color: COLORS.DANGER     },
  cooldown:    { emoji: "⏱️",  label: "Cooldown",           color: COLORS.WARNING    },
  premium:     { emoji: "⭐",  label: "Premium Required",   color: COLORS.PREMIUM    },
  unknown:     { emoji: "❓",  label: "Unknown Error",      color: COLORS.LOADING    },
};

function classifyError(err: unknown): keyof typeof ERROR_META {
  if (err instanceof RateLimitError)       return "ratelimit";
  if (err instanceof PermissionError)      return "permission";
  if (err instanceof CooldownError)        return "cooldown";
  if (err instanceof PremiumRequiredError) return "premium";
  if (isUserError(err))                    return "user";
  if (isApiError(err))                     return "api";
  if (isDatabaseError(err))               return "database";
  if (isPanindiganError(err))              return "bot";
  return "unknown";
}

// ── Builder ───────────────────────────────────────────────────────────────────

export interface ErrorEmbedOptions {
  /** Typed error object — auto-classified when provided. */
  error?:    unknown;
  /** Override title. */
  title?:    string;
  /** What happened (shown as first field). */
  what?:     string;
  /** Why it happened. */
  why?:      string;
  /** Step-by-step fix. */
  fix?:      string;
  /** Suggested command (e.g. "/help play"). */
  command?:  string;
  /** Link to documentation. */
  docsUrl?:  string;
  /** Support server URL (shown on the support button). */
  supportUrl?: string;
  /** Show retry + support buttons. Default true. */
  showButtons?: boolean;
  /** Retry button will carry this custom ID suffix. */
  retryContext?: string;
  /** Shard ID for footer. */
  shardId?: number;
}

export interface ErrorPayload {
  embeds:     EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
  ephemeral:  boolean;
}

export class ErrorBuilder {
  private readonly opts: ErrorEmbedOptions;

  constructor(opts: ErrorEmbedOptions = {}) {
    this.opts = opts;
  }

  private resolveType(): typeof ERROR_META[string] {
    return ERROR_META[classifyError(this.opts.error)] ?? ERROR_META["unknown"]!;
  }

  private resolveMessage(): string {
    const { error } = this.opts;
    if (!error) return "May nangyaring hindi inaasahang error.";
    if (error instanceof Error) return error.message;
    return String(error);
  }

  /** Build the full error embed per v0.2.6 Error Anatomy. */
  buildEmbed(): EmbedBuilder {
    const { title, what, why, fix, command, docsUrl, shardId } = this.opts;
    const meta    = this.resolveType();
    const message = this.resolveMessage();
    const shard   = shardId !== undefined ? ` | Shard ${shardId}` : "";

    const embed = new EmbedBuilder()
      .setColor(meta.color as ColorResolvable)
      .setTitle(`${meta.emoji} ${title ?? `${meta.label}`}`)
      .setTimestamp()
      .setFooter({
        text:    `🤖 Panindigan Official · v${BOT_VERSION}${shard}`,
        iconURL: "https://cdn.discordapp.com/embed/avatars/0.png",
      });

    const fields: { name: string; value: string; inline: boolean }[] = [];

    fields.push({ name: "📄 Nangyari", value: what ?? message, inline: false });

    if (why) {
      fields.push({ name: "🤔 Bakit", value: why, inline: false });
    }

    if (fix) {
      fields.push({ name: "🛠️ Paano Ayusin", value: fix, inline: false });
    }

    if (command) {
      fields.push({ name: "💡 Subukan Ito", value: `\`${command}\``, inline: true });
    }

    if (docsUrl) {
      fields.push({ name: "📚 Dokumentasyon", value: `[Basahin dito](${docsUrl})`, inline: true });
    }

    embed.addFields(fields);
    return embed;
  }

  /** Build the action row: Retry + Support buttons. */
  buildButtons(supportUrl?: string): ActionRowBuilder<ButtonBuilder> {
    const retryId = this.opts.retryContext
      ? `${CUSTOM_ID.ERROR_RETRY}:${this.opts.retryContext}`
      : CUSTOM_ID.ERROR_RETRY;

    const retry = new ButtonBuilder()
      .setCustomId(retryId)
      .setLabel("🔁 Subukan Ulit")
      .setStyle(ButtonStyle.Primary);

    const support = new ButtonBuilder()
      .setLabel("🆘 Support")
      .setStyle(ButtonStyle.Link)
      .setURL(supportUrl ?? this.opts.supportUrl ?? "https://discord.gg/panindigan");

    return new ActionRowBuilder<ButtonBuilder>().addComponents(retry, support);
  }

  /** Build the full error payload (embed + optional buttons). */
  build(): ErrorPayload {
    const { showButtons = true, supportUrl } = this.opts;
    const embed = this.buildEmbed();

    return {
      embeds:     [embed],
      components: showButtons ? [this.buildButtons(supportUrl)] : [],
      ephemeral:  true,
    };
  }

  // ── Static convenience factories ──────────────────────────────────────────

  /** User error — invalid input, bad arguments. */
  static userError(message: string, fix?: string, opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      title: "Mali ang Input",
      what:  message,
      fix,
    }).build();
  }

  /** Permission denied — Filipino-warm tone. */
  static permissionDenied(action: string, required: string[], opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      error: new PermissionError(action, required),
      title: "Walang Permission",
      what:  `Wala kang sapat na permiso para ${action}.`,
      fix:   `Kailangan mo: ${required.join(", ")}. Makipag-ugnayan sa iyong server admin.`,
    }).build();
  }

  /** Cooldown active — Filipino-warm tone. */
  static cooldown(commandName: string, remainingMs: number, opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    const secs = Math.ceil(remainingMs / 1000);
    return new ErrorBuilder({
      ...opts,
      error: new CooldownError(commandName, remainingMs),
      title: "Sandali Lang!",
      what:  `Ang \`/${commandName}\` ay naka-cooldown pa.`,
      fix:   `Subukan ulit pagkatapos ng **${secs} segundo${secs === 1 ? "" : "s"}**. 😊`,
      showButtons: false,
    }).build();
  }

  /** Premium required — Filipino-warm tone. */
  static premiumRequired(tier: number, opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      error: new PremiumRequiredError(tier),
      title: "Premium Feature",
      what:  `Ang feature na ito ay para sa **Premium Tier ${tier}** subscribers.`,
      fix:   "I-upgrade ang iyong server para ma-unlock ang feature na ito. 🚀",
      command: "/premium",
      showButtons: false,
    }).build();
  }

  /** Generic internal bot error — Filipino-warm tone. */
  static internalError(err: unknown, opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      error: err,
      title: "May Nangyaring Mali",
      what:  "May internal error na nangyari habang pinoproseso ang iyong kahilingan.",
      why:   "Ito ay bug sa aming panig, hindi sa iyo.",
      fix:   "Subukan ulit. Kung patuloy ang problema, i-click ang Support. 🙏",
    }).build();
  }

  /** API / external service error — Filipino-warm tone. */
  static apiError(service: string, opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      title: `${service} Hindi Available`,
      what:  `Ang ${service} service ay pansamantalang hindi available.`,
      fix:   "Subukan ulit pagkatapos ng ilang sandali. Pasensya na! 🙏",
    }).build();
  }

  /** Voice channel required — Filipino-warm tone. */
  static voiceRequired(opts: Partial<ErrorEmbedOptions> = {}): ErrorPayload {
    return new ErrorBuilder({
      ...opts,
      title: "Mag-join Muna sa Voice Channel",
      what:  "Hindi ka pa naka-join sa isang voice channel.",
      fix:   "Mag-join ka muna sa isang voice channel, tapos subukan ulit! 🎵",
      showButtons: false,
    }).build();
  }
}
