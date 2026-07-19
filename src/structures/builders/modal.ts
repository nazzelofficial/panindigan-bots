/**
 * Modal builder helpers.
 * Factory functions for Discord modals with typed text input helpers.
 *
 * Component ID scheme: <category>:<action>:<targetId>:v1
 */

import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
} from "discord.js";

export interface TextInputOptions {
  /** The customId of this text input field. */
  customId: string;
  label: string;
  placeholder?: string;
  /** Initial pre-filled value. */
  value?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

/** A single-line text input. */
export function shortInput(opts: TextInputOptions): TextInputBuilder {
  const input = new TextInputBuilder()
    .setCustomId(opts.customId)
    .setLabel(opts.label)
    .setStyle(TextInputStyle.Short)
    .setRequired(opts.required ?? true);
  if (opts.placeholder) input.setPlaceholder(opts.placeholder);
  if (opts.value)       input.setValue(opts.value);
  if (opts.minLength)   input.setMinLength(opts.minLength);
  if (opts.maxLength)   input.setMaxLength(opts.maxLength);
  return input;
}

/** A multi-line paragraph text input. */
export function paragraphInput(opts: TextInputOptions): TextInputBuilder {
  const input = new TextInputBuilder()
    .setCustomId(opts.customId)
    .setLabel(opts.label)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(opts.required ?? true);
  if (opts.placeholder) input.setPlaceholder(opts.placeholder);
  if (opts.value)       input.setValue(opts.value);
  if (opts.minLength)   input.setMinLength(opts.minLength);
  if (opts.maxLength)   input.setMaxLength(opts.maxLength);
  return input;
}

/** Wrap a TextInputBuilder in a single-component ActionRow. */
function toRow(input: TextInputBuilder): ActionRowBuilder<ModalActionRowComponentBuilder> {
  return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input);
}

export interface ModalOptions {
  /** customId for the modal — follow the "<category>:<action>:<target>:v1" scheme. */
  customId: string;
  title: string;
  /** Up to 5 text inputs. */
  inputs: TextInputBuilder[];
}

/**
 * Build a ModalBuilder from a list of TextInputBuilders.
 * Automatically wraps each input in an ActionRow.
 */
export function buildModal(opts: ModalOptions): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(opts.customId)
    .setTitle(opts.title);

  const rows = opts.inputs.slice(0, 5).map(toRow);
  modal.addComponents(...rows);
  return modal;
}
