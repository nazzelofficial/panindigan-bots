/**
 * lib/errors.ts v0.2.6
 * Typed error classes per domain — centralized errors for every failure path.
 * Every domain has its own error class so callers can use instanceof checks.
 *
 * QA: No silently-ignored errors — all errors are typed and carry context.
 */

// ── Base ──────────────────────────────────────────────────────────────────────

export abstract class PanindiganError extends Error {
  readonly code: string = "PANINDIGAN_ERROR";
  readonly domain: string = "unknown";
  readonly timestamp: Date;
  readonly context: Record<string, unknown>;

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name      = new.target.name;
    this.timestamp = new Date();
    this.context   = context;
    // Restore prototype chain (required for custom Error subclasses in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name:      this.name,
      code:      this.code,
      domain:    this.domain,
      message:   this.message,
      context:   this.context,
      timestamp: this.timestamp.toISOString(),
      stack:     this.stack,
    };
  }
}

// ── User errors (⚠️) — invalid input, missing permissions ────────────────────

export class UserError extends PanindiganError {
  override readonly code   = "USER_ERROR";
  override readonly domain = "user";

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context);
  }
}

export class PermissionError extends PanindiganError {
  override readonly code   = "PERMISSION_DENIED";
  override readonly domain = "user";
  readonly required: string[];
  readonly action: string;

  constructor(action: string, required: string[], context: Record<string, unknown> = {}) {
    super(`Missing permission to perform: ${action}`, { ...context, action, required });
    this.required = required;
    this.action   = action;
  }
}

export class ValidationError extends PanindiganError {
  override readonly code   = "VALIDATION_FAILED";
  override readonly domain = "user";
  readonly field?: string;

  constructor(message: string, field?: string, context: Record<string, unknown> = {}) {
    super(message, { ...context, field });
    this.field = field;
  }
}

export class CooldownError extends PanindiganError {
  override readonly code   = "ON_COOLDOWN";
  override readonly domain = "user";
  readonly remainingMs: number;
  readonly commandName: string;

  constructor(commandName: string, remainingMs: number, context: Record<string, unknown> = {}) {
    super(`Command "${commandName}" is on cooldown for ${Math.ceil(remainingMs / 1000)}s`, {
      ...context, commandName, remainingMs,
    });
    this.remainingMs = remainingMs;
    this.commandName = commandName;
  }
}

export class PremiumRequiredError extends PanindiganError {
  override readonly code   = "PREMIUM_REQUIRED";
  override readonly domain = "user";
  readonly requiredTier: number;

  constructor(requiredTier: number, context: Record<string, unknown> = {}) {
    super(`This feature requires Premium tier ${requiredTier}`, { ...context, requiredTier });
    this.requiredTier = requiredTier;
  }
}

// ── Bot / internal errors (🔴) ────────────────────────────────────────────────

export class BotError extends PanindiganError {
  override readonly code   = "INTERNAL_ERROR";
  override readonly domain = "bot";

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, context);
  }
}

export class CommandNotFoundError extends PanindiganError {
  override readonly code   = "COMMAND_NOT_FOUND";
  override readonly domain = "bot";

  constructor(commandName: string, context: Record<string, unknown> = {}) {
    super(`Command "${commandName}" not found`, { ...context, commandName });
  }
}

// ── API errors (📡) — external service failures ───────────────────────────────

export class ApiError extends PanindiganError {
  override readonly code: string = "API_ERROR";
  override readonly domain    = "api";
  readonly service:    string;
  readonly statusCode?: number;

  constructor(service: string, message: string, statusCode?: number, context: Record<string, unknown> = {}) {
    super(`[${service}] ${message}`, { ...context, service, statusCode });
    this.service    = service;
    this.statusCode = statusCode;
  }
}

export class OpenAIError extends ApiError {
  override readonly code: string = "OPENAI_ERROR";

  constructor(message: string, statusCode?: number, context: Record<string, unknown> = {}) {
    super("OpenAI", message, statusCode, context);
  }
}

export class LavalinkError extends ApiError {
  override readonly code: string = "LAVALINK_ERROR";

  constructor(message: string, context: Record<string, unknown> = {}) {
    super("Lavalink", message, undefined, context);
  }
}

// ── Database errors (🗄️) ──────────────────────────────────────────────────────

export class DatabaseError extends PanindiganError {
  override readonly code: string = "DATABASE_ERROR";
  override readonly domain    = "database";
  readonly operation?: string;

  constructor(message: string, operation?: string, context: Record<string, unknown> = {}) {
    super(message, { ...context, operation });
    this.operation = operation;
  }
}

export class DatabaseConnectionError extends DatabaseError {
  override readonly code: string = "DB_CONNECTION_FAILED";

  constructor(context: Record<string, unknown> = {}) {
    super("Database connection failed", "connect", context);
  }
}

export class DocumentNotFoundError extends DatabaseError {
  override readonly code: string = "DOCUMENT_NOT_FOUND";
  readonly collection: string;
  readonly query: Record<string, unknown>;

  constructor(collection: string, query: Record<string, unknown>, context: Record<string, unknown> = {}) {
    super(`Document not found in ${collection}`, "findOne", { ...context, collection, query });
    this.collection = collection;
    this.query      = query;
  }
}

// ── Rate limit errors (⏳) ────────────────────────────────────────────────────

export class RateLimitError extends PanindiganError {
  override readonly code      = "RATE_LIMITED";
  override readonly domain    = "security";
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number, context: Record<string, unknown> = {}) {
    super(`Rate limited — retry in ${Math.ceil(retryAfterMs / 1000)}s`, { ...context, retryAfterMs });
    this.retryAfterMs = retryAfterMs;
  }
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isUserError(e: unknown): e is UserError {
  return e instanceof UserError
    || e instanceof PermissionError
    || e instanceof ValidationError
    || e instanceof CooldownError
    || e instanceof PremiumRequiredError;
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function isDatabaseError(e: unknown): e is DatabaseError {
  return e instanceof DatabaseError;
}

export function isPanindiganError(e: unknown): e is PanindiganError {
  return e instanceof PanindiganError;
}
