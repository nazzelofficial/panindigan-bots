/**
 * Modal builder helpers.
 * Factory functions for Discord modals with typed text input helpers.
 *
 * Component ID scheme: <category>:<action>:<targetId>:v1
 */
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, } from "discord.js";
/** A single-line text input. */
export function shortInput(opts) {
    const input = new TextInputBuilder()
        .setCustomId(opts.customId)
        .setLabel(opts.label)
        .setStyle(TextInputStyle.Short)
        .setRequired(opts.required ?? true);
    if (opts.placeholder)
        input.setPlaceholder(opts.placeholder);
    if (opts.value)
        input.setValue(opts.value);
    if (opts.minLength)
        input.setMinLength(opts.minLength);
    if (opts.maxLength)
        input.setMaxLength(opts.maxLength);
    return input;
}
/** A multi-line paragraph text input. */
export function paragraphInput(opts) {
    const input = new TextInputBuilder()
        .setCustomId(opts.customId)
        .setLabel(opts.label)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(opts.required ?? true);
    if (opts.placeholder)
        input.setPlaceholder(opts.placeholder);
    if (opts.value)
        input.setValue(opts.value);
    if (opts.minLength)
        input.setMinLength(opts.minLength);
    if (opts.maxLength)
        input.setMaxLength(opts.maxLength);
    return input;
}
/** Wrap a TextInputBuilder in a single-component ActionRow. */
function toRow(input) {
    return new ActionRowBuilder().addComponents(input);
}
/**
 * Build a ModalBuilder from a list of TextInputBuilders.
 * Automatically wraps each input in an ActionRow.
 */
export function buildModal(opts) {
    const modal = new ModalBuilder()
        .setCustomId(opts.customId)
        .setTitle(opts.title);
    const rows = opts.inputs.slice(0, 5).map(toRow);
    modal.addComponents(...rows);
    return modal;
}
//# sourceMappingURL=modal.js.map