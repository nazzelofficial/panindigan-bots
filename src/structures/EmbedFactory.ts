/**
 * EmbedFactory — unified embed builder for every embed type used in the bot.
 * Import this instead of the individual helper functions in src/utils/embeds.ts.
 * The helpers in embeds.ts are kept as aliases for backward compatibility.
 */

import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { config } from "../config/config.js";

type ColorKey = keyof typeof config.colors;

function base(color: ColorKey): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(config.colors[color] as ColorResolvable)
    .setTimestamp();
}

export class EmbedFactory {
  /** ✅ Green — operation completed successfully. */
  static success(description: string, title?: string): EmbedBuilder {
    const e = base("success").setDescription(`✅ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ❌ Red — something went wrong. */
  static error(description: string, title?: string): EmbedBuilder {
    const e = base("danger").setDescription(`❌ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ⚠️ Yellow — non-fatal warning or notice. */
  static warning(description: string, title?: string): EmbedBuilder {
    const e = base("warning").setDescription(`⚠️ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ℹ️ Blue — neutral information. */
  static info(description: string, title?: string): EmbedBuilder {
    const e = base("info").setDescription(`ℹ️ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ⏳ Grey — background operation in progress. */
  static loading(description: string, title?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0x808080)
      .setTimestamp()
      .setDescription(`⏳ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ❓ Orange — prompts a yes/no confirmation from the user. */
  static confirm(description: string, title?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTimestamp()
      .setDescription(`❓ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** ⭐ Gold — premium-gated feature notice. */
  static premium(description: string, title?: string): EmbedBuilder {
    const e = base("premium").setDescription(`⭐ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /** 🎛️ Blurple — dashboard or settings output. */
  static dashboard(description: string, title?: string): EmbedBuilder {
    const e = base("primary").setDescription(`🎛️ ${description}`);
    if (title) e.setTitle(title);
    return e;
  }

  /**
   * Generic base embed — use when none of the typed variants fit.
   * Accepts a key from config.colors.
   */
  static base(color: ColorKey = "primary"): EmbedBuilder {
    return base(color);
  }

  /** ⏳ Staged — background operation in progress (alias for loading). */
  static staged(description: string, title?: string): EmbedBuilder {
    return EmbedFactory.loading(description, title);
  }

  /** 🎵 Music — music player embeds. */
  static music(description: string, title: string): EmbedBuilder {
    const e = base("primary").setDescription(description);
    e.setTitle(title);
    return e;
  }

  /** ⚠️ Danger — alias for error for consistency. */
  static danger(description: string, title?: string): EmbedBuilder {
    return EmbedFactory.error(description, title);
  }
}
