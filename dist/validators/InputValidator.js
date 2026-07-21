/**
 * validators/InputValidator.ts v0.2.6
 * Input sanitization + schema validation per the v0.2.6 Security spec.
 *
 * Security layers:
 *   📝 Modal Validation     — input sanitization + schema validation
 *   🔒 Input Sanitization   — XSS + injection prevention
 *   🔗 URL Validation       — blocklist of malicious domains
 *   📎 Attachment Validation — file type + size validation
 */
import { VALIDATION, EMBED_LIMITS } from "../constants/index.js";
import { ValidationError } from "../lib/errors.js";
/**
 * Sanitize and validate a string input.
 * Strips zero-width characters, control characters, and optionally HTML.
 * Throws ValidationError on failure.
 */
export function validateString(value, options = {}) {
    const { minLength = 0, maxLength = VALIDATION.MAX_STRING_LENGTH, required = false, fieldName = "value", allowNewlines = true, stripHtml = true, } = options;
    if (value === null || value === undefined || value === "") {
        if (required)
            throw new ValidationError(`${fieldName} is required`, fieldName);
        return "";
    }
    if (typeof value !== "string") {
        throw new ValidationError(`${fieldName} must be a string`, fieldName, { received: typeof value });
    }
    let str = value
        // Strip zero-width and control chars (except newlines/tabs when allowed)
        .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
        .replace(allowNewlines
        ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g
        : /[\x00-\x1F\x7F]/g, "")
        // Collapse multiple spaces
        .replace(/ {2,}/g, " ")
        .trim();
    if (stripHtml) {
        str = str
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/<[^>]*>/g, "")
            .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }
    if (str.length < minLength) {
        throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName, { length: str.length, minLength });
    }
    if (str.length > maxLength) {
        throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`, fieldName, { length: str.length, maxLength });
    }
    return str;
}
/** Truncate a string to fit Discord embed limits without throwing. */
export function truncateField(value, limit = EMBED_LIMITS.FIELD_VALUE, suffix = "…") {
    if (value.length <= limit)
        return value;
    return value.slice(0, limit - suffix.length) + suffix;
}
/** Truncate embed description to limit. */
export function truncateDescription(value, suffix = "…") {
    return truncateField(value, EMBED_LIMITS.DESCRIPTION, suffix);
}
/** Truncate embed title to limit. */
export function truncateTitle(value, suffix = "…") {
    return truncateField(value, EMBED_LIMITS.TITLE, suffix);
}
// ── URL validation ────────────────────────────────────────────────────────────
/**
 * Validate a URL — checks format and blocklist of known malicious domains.
 * Returns the cleaned URL string or throws ValidationError.
 */
export function validateUrl(value, fieldName = "url") {
    const str = validateString(value, { fieldName, required: true, maxLength: 2000 });
    let parsed;
    try {
        parsed = new URL(str);
    }
    catch {
        throw new ValidationError(`${fieldName} is not a valid URL`, fieldName, { value: str });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new ValidationError(`${fieldName} must use http or https`, fieldName, { protocol: parsed.protocol });
    }
    const hostname = parsed.hostname.toLowerCase();
    const blocked = VALIDATION.BLOCKED_URL_PATTERNS.some((pattern) => hostname.includes(pattern));
    if (blocked) {
        throw new ValidationError(`${fieldName} contains a blocked domain`, fieldName, { hostname });
    }
    return str;
}
/** Returns true when the URL is safe (does not throw). */
export function isUrlSafe(url) {
    try {
        validateUrl(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate a Discord attachment object.
 * Throws ValidationError if the file is too large or the type is not allowed.
 */
export function validateAttachment(attachment, options = {}) {
    const { maxBytes = VALIDATION.MAX_ATTACHMENT_BYTES, allowedTypes = VALIDATION.ALLOWED_IMAGE_TYPES, fieldName = "attachment", } = options;
    if (attachment.size > maxBytes) {
        const maxMB = (maxBytes / 1_048_576).toFixed(0);
        throw new ValidationError(`${fieldName} exceeds the maximum size of ${maxMB} MB`, fieldName, { size: attachment.size, maxBytes });
    }
    const mime = attachment.contentType?.split(";")[0]?.trim().toLowerCase();
    if (mime && !allowedTypes.includes(mime)) {
        throw new ValidationError(`${fieldName} type "${mime}" is not allowed. Allowed: ${allowedTypes.join(", ")}`, fieldName, { contentType: mime });
    }
    const name = attachment.name ?? "";
    if (name.length > VALIDATION.MAX_FILENAME_LENGTH) {
        throw new ValidationError(`${fieldName} filename is too long`, fieldName);
    }
}
// ── Reason / mention validators ───────────────────────────────────────────────
/** Validate a moderation reason string. */
export function validateReason(value) {
    return validateString(value, {
        fieldName: "reason",
        maxLength: VALIDATION.MAX_REASON_LENGTH,
        required: false,
    }) || "No reason provided";
}
/** Count @mentions in a string; throws if it exceeds the limit. */
export function validateMentionCount(content, maxMentions = 5) {
    const count = (content.match(/<@[!&]?\d+>/g) ?? []).length
        + (content.match(/@(everyone|here)/g) ?? []).length;
    if (count > maxMentions) {
        throw new ValidationError(`Message contains too many mentions (${count}). Maximum allowed: ${maxMentions}`, "content", { count, maxMentions });
    }
}
// ── Number validators ─────────────────────────────────────────────────────────
export function validateInt(value, min, max, fieldName = "number") {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
        throw new ValidationError(`${fieldName} must be an integer`, fieldName, { value });
    }
    if (n < min || n > max) {
        throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName, { value: n, min, max });
    }
    return n;
}
export function validatePositiveInt(value, fieldName = "number") {
    return validateInt(value, 1, Number.MAX_SAFE_INTEGER, fieldName);
}
//# sourceMappingURL=InputValidator.js.map