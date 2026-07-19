/**
 * Input sanitization helpers.
 * Strip dangerous / noisy characters from every user-provided string before
 * it reaches command logic, the database, or an embed.
 */

/** Maximum length accepted for any user-provided string option. */
const MAX_INPUT_LENGTH = 1_000;

/**
 * Sanitize a single string value coming from a slash-command option or a
 * prefix-command argument.
 *
 * Removes:
 * - Zero-width and invisible Unicode characters (U+200B … U+200F, U+FEFF, etc.)
 * - ASCII control characters (0x00–0x1F, 0x7F) except newline/tab
 * - Excess whitespace (leading/trailing, consecutive interior spaces collapsed)
 *
 * Truncates to MAX_INPUT_LENGTH characters after stripping.
 */
export function sanitizeString(value: string): string {
  return value
    // Remove zero-width / invisible codepoints
    .replace(/[\u200B-\u200F\u2028\u2029\uFEFF\u00AD]/g, "")
    // Remove ASCII control chars except \t (0x09) and \n (0x0A)
    .replace(/[\x00-\x08\x0B-\x1F\x7F]/g, "")
    // Collapse runs of whitespace to a single space (preserves newlines)
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

/**
 * Sanitize all string values in a plain object in-place and return the same
 * object.  Non-string values are left untouched.
 */
export function sanitizeRecord<T extends Record<string, unknown>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string") (obj as Record<string, unknown>)[key] = sanitizeString(v);
  }
  return obj;
}

/**
 * Sanitize an array of prefix-command argument strings.
 */
export function sanitizeArgs(args: string[]): string[] {
  return args.map(sanitizeString);
}

/**
 * Returns true when the input exceeds the maximum length BEFORE stripping,
 * which can be used to warn the user before we truncate.
 */
export function isTooLong(value: string): boolean {
  return value.length > MAX_INPUT_LENGTH;
}

/** Exposed for tests / audit logging. */
export const SANITIZE_MAX_LENGTH = MAX_INPUT_LENGTH;
