/**
 * Button builder helpers.
 * Factory functions for every ButtonStyle variant with consistent defaults.
 *
 * Component ID scheme: <category>:<action>:<targetId>:v1
 * e.g.  "ticket:close:123456:v1"
 */

import {
  ButtonBuilder,
  ButtonStyle,
  type APIMessageComponentEmoji,
} from "discord.js";

export interface ButtonOptions {
  /** Component custom ID — follow the "<category>:<action>:<target>:v1" scheme. */
  customId?: string;
  /** Button label text. */
  label?: string;
  /** Discord emoji object or string shorthand. */
  emoji?: APIMessageComponentEmoji | string;
  /** Whether the button is initially disabled. */
  disabled?: boolean;
}

function applyEmoji(btn: ButtonBuilder, emoji?: APIMessageComponentEmoji | string): ButtonBuilder {
  if (!emoji) return btn;
  if (typeof emoji === "string") return btn.setEmoji(emoji);
  return btn.setEmoji(emoji);
}

/** 🔵 Primary (blurple) — the main call-to-action. */
export function primaryButton(options: ButtonOptions): ButtonBuilder {
  const btn = new ButtonBuilder().setStyle(ButtonStyle.Primary);
  if (options.customId) btn.setCustomId(options.customId);
  if (options.label)    btn.setLabel(options.label);
  if (options.disabled) btn.setDisabled(true);
  return applyEmoji(btn, options.emoji);
}

/** ⚪ Secondary (grey) — low-emphasis action. */
export function secondaryButton(options: ButtonOptions): ButtonBuilder {
  const btn = new ButtonBuilder().setStyle(ButtonStyle.Secondary);
  if (options.customId) btn.setCustomId(options.customId);
  if (options.label)    btn.setLabel(options.label);
  if (options.disabled) btn.setDisabled(true);
  return applyEmoji(btn, options.emoji);
}

/** 🟢 Success (green) — confirm / approve action. */
export function successButton(options: ButtonOptions): ButtonBuilder {
  const btn = new ButtonBuilder().setStyle(ButtonStyle.Success);
  if (options.customId) btn.setCustomId(options.customId);
  if (options.label)    btn.setLabel(options.label);
  if (options.disabled) btn.setDisabled(true);
  return applyEmoji(btn, options.emoji);
}

/** 🔴 Danger (red) — destructive / deny action. */
export function dangerButton(options: ButtonOptions): ButtonBuilder {
  const btn = new ButtonBuilder().setStyle(ButtonStyle.Danger);
  if (options.customId) btn.setCustomId(options.customId);
  if (options.label)    btn.setLabel(options.label);
  if (options.disabled) btn.setDisabled(true);
  return applyEmoji(btn, options.emoji);
}

/** 🔗 Link — opens a URL in the browser; no customId. */
export function linkButton(label: string, url: string, emoji?: APIMessageComponentEmoji | string): ButtonBuilder {
  const btn = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel(label)
    .setURL(url);
  return applyEmoji(btn, emoji);
}

/** Convenience: a "✅ Confirm" + "❌ Cancel" button pair. */
export function confirmCancelRow(confirmId: string, cancelId: string) {
  return [
    successButton({ customId: confirmId, label: "Confirm", emoji: "✅" }),
    dangerButton({  customId: cancelId,  label: "Cancel",  emoji: "❌" }),
  ];
}

/** Convenience: previous / next pagination pair. */
export function paginationButtons(prevId: string, nextId: string, page: number, totalPages: number) {
  return [
    secondaryButton({ customId: prevId, label: "◀ Previous", disabled: page <= 1 }),
    secondaryButton({ customId: nextId, label: "Next ▶",     disabled: page >= totalPages }),
  ];
}
