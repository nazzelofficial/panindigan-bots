/**
 * lib/errors.ts v0.2.6
 * Typed error classes per domain — centralized errors for every failure path.
 * Every domain has its own error class so callers can use instanceof checks.
 *
 * QA: No silently-ignored errors — all errors are typed and carry context.
 */
// ── Base ──────────────────────────────────────────────────────────────────────
export class PanindiganError extends Error {
    code = "PANINDIGAN_ERROR";
    domain = "unknown";
    timestamp;
    context;
    constructor(message, context = {}) {
        super(message);
        this.name = new.target.name;
        this.timestamp = new Date();
        this.context = context;
        // Restore prototype chain (required for custom Error subclasses in TS)
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            domain: this.domain,
            message: this.message,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }
}
// ── User errors (⚠️) — invalid input, missing permissions ────────────────────
export class UserError extends PanindiganError {
    code = "USER_ERROR";
    domain = "user";
    constructor(message, context = {}) {
        super(message, context);
    }
}
export class PermissionError extends PanindiganError {
    code = "PERMISSION_DENIED";
    domain = "user";
    required;
    action;
    constructor(action, required, context = {}) {
        super(`Missing permission to perform: ${action}`, { ...context, action, required });
        this.required = required;
        this.action = action;
    }
}
export class ValidationError extends PanindiganError {
    code = "VALIDATION_FAILED";
    domain = "user";
    field;
    constructor(message, field, context = {}) {
        super(message, { ...context, field });
        this.field = field;
    }
}
export class CooldownError extends PanindiganError {
    code = "ON_COOLDOWN";
    domain = "user";
    remainingMs;
    commandName;
    constructor(commandName, remainingMs, context = {}) {
        super(`Command "${commandName}" is on cooldown for ${Math.ceil(remainingMs / 1000)}s`, {
            ...context, commandName, remainingMs,
        });
        this.remainingMs = remainingMs;
        this.commandName = commandName;
    }
}
export class PremiumRequiredError extends PanindiganError {
    code = "PREMIUM_REQUIRED";
    domain = "user";
    requiredTier;
    constructor(requiredTier, context = {}) {
        super(`This feature requires Premium tier ${requiredTier}`, { ...context, requiredTier });
        this.requiredTier = requiredTier;
    }
}
// ── Bot / internal errors (🔴) ────────────────────────────────────────────────
export class BotError extends PanindiganError {
    code = "INTERNAL_ERROR";
    domain = "bot";
    constructor(message, context = {}) {
        super(message, context);
    }
}
export class CommandNotFoundError extends PanindiganError {
    code = "COMMAND_NOT_FOUND";
    domain = "bot";
    constructor(commandName, context = {}) {
        super(`Command "${commandName}" not found`, { ...context, commandName });
    }
}
// ── API errors (📡) — external service failures ───────────────────────────────
export class ApiError extends PanindiganError {
    code = "API_ERROR";
    domain = "api";
    service;
    statusCode;
    constructor(service, message, statusCode, context = {}) {
        super(`[${service}] ${message}`, { ...context, service, statusCode });
        this.service = service;
        this.statusCode = statusCode;
    }
}
export class OpenAIError extends ApiError {
    code = "OPENAI_ERROR";
    constructor(message, statusCode, context = {}) {
        super("OpenAI", message, statusCode, context);
    }
}
export class LavalinkError extends ApiError {
    code = "LAVALINK_ERROR";
    constructor(message, context = {}) {
        super("Lavalink", message, undefined, context);
    }
}
// ── Database errors (🗄️) ──────────────────────────────────────────────────────
export class DatabaseError extends PanindiganError {
    code = "DATABASE_ERROR";
    domain = "database";
    operation;
    constructor(message, operation, context = {}) {
        super(message, { ...context, operation });
        this.operation = operation;
    }
}
export class DatabaseConnectionError extends DatabaseError {
    code = "DB_CONNECTION_FAILED";
    constructor(context = {}) {
        super("Database connection failed", "connect", context);
    }
}
export class DocumentNotFoundError extends DatabaseError {
    code = "DOCUMENT_NOT_FOUND";
    collection;
    query;
    constructor(collection, query, context = {}) {
        super(`Document not found in ${collection}`, "findOne", { ...context, collection, query });
        this.collection = collection;
        this.query = query;
    }
}
// ── Rate limit errors (⏳) ────────────────────────────────────────────────────
export class RateLimitError extends PanindiganError {
    code = "RATE_LIMITED";
    domain = "security";
    retryAfterMs;
    constructor(retryAfterMs, context = {}) {
        super(`Rate limited — retry in ${Math.ceil(retryAfterMs / 1000)}s`, { ...context, retryAfterMs });
        this.retryAfterMs = retryAfterMs;
    }
}
// ── Type guards ───────────────────────────────────────────────────────────────
export function isUserError(e) {
    return e instanceof UserError
        || e instanceof PermissionError
        || e instanceof ValidationError
        || e instanceof CooldownError
        || e instanceof PremiumRequiredError;
}
export function isApiError(e) {
    return e instanceof ApiError;
}
export function isDatabaseError(e) {
    return e instanceof DatabaseError;
}
export function isPanindiganError(e) {
    return e instanceof PanindiganError;
}
//# sourceMappingURL=errors.js.map