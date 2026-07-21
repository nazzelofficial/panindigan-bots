/**
 * validators/ModalValidator.ts v0.2.6
 * Modal input validation — typed schema checks for Discord modal submissions.
 *
 * Usage:
 *   const validator = new ModalValidator(interaction);
 *   const title  = validator.requireText("title",  { maxLength: 100 });
 *   const reason = validator.optionalText("reason", { maxLength: 512 });
 */

import type { ModalSubmitInteraction } from "discord.js";
import { ValidationError } from "../lib/errors.js";
import { validateString, validateUrl } from "./InputValidator.js";
import type { StringValidationOptions } from "./InputValidator.js";

export class ModalValidator {
  private readonly interaction: ModalSubmitInteraction;
  private readonly errors: ValidationError[] = [];

  constructor(interaction: ModalSubmitInteraction) {
    this.interaction = interaction;
  }

  /**
   * Get a required text field. Throws ValidationError if absent or invalid.
   */
  requireText(customId: string, options: StringValidationOptions = {}): string {
    const raw = this.interaction.fields.getTextInputValue(customId);
    return validateString(raw, { ...options, required: true, fieldName: customId });
  }

  /**
   * Get an optional text field. Returns empty string when absent.
   */
  optionalText(customId: string, options: StringValidationOptions = {}): string {
    try {
      const raw = this.interaction.fields.getTextInputValue(customId);
      return validateString(raw, { ...options, required: false, fieldName: customId });
    } catch {
      return "";
    }
  }

  /**
   * Get a required URL field. Throws ValidationError if absent or invalid.
   */
  requireUrl(customId: string): string {
    const raw = this.interaction.fields.getTextInputValue(customId);
    return validateUrl(raw, customId);
  }

  /**
   * Get a required integer field within a range. Throws if out of range.
   */
  requireInt(customId: string, min: number, max: number): number {
    const raw = this.interaction.fields.getTextInputValue(customId);
    const n   = Number(raw.trim());
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new ValidationError(`${customId} must be a whole number`, customId, { raw });
    }
    if (n < min || n > max) {
      throw new ValidationError(
        `${customId} must be between ${min} and ${max}`,
        customId,
        { value: n, min, max },
      );
    }
    return n;
  }

  /**
   * Collect all field errors instead of throwing on first.
   * Call validate() after all fields are checked to surface all errors at once.
   */
  tryText(customId: string, options: StringValidationOptions = {}): string | null {
    try {
      return this.requireText(customId, options);
    } catch (e) {
      if (e instanceof ValidationError) this.errors.push(e);
      return null;
    }
  }

  /** Throws an aggregate ValidationError if any errors were collected via tryText(). */
  validate(): void {
    if (this.errors.length === 0) return;
    const messages = this.errors.map((e) => `• ${e.message}`).join("\n");
    throw new ValidationError(`Validation failed:\n${messages}`, undefined, {
      count: this.errors.length,
    });
  }

  /** Returns all collected errors without throwing. */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }
}
