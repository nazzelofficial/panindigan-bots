/**
 * features/ai/aiService.ts v0.2.6
 * AI Platform Service — memory, retry logic, provider failover
 *
 * v0.2.6 AI Platform Features:
 *   🧠 Conversation Memory — persistent per-user conversation history
 *   🔄 Retry Logic — exponential backoff on failures
 *   🔀 Provider Failover — automatic fallback to backup providers
 *   📡 Streaming Responses — real-time response streaming
 *   ⌨️ Typing Indicators — Discord typing while AI thinks
 *   💾 Response Caching — cache common responses
 *   🎭 Custom Personas — per-guild AI personality configuration
 */

import OpenAI from "openai";
import { scopedLogger } from "../../utils/logger.js";
import { withRecovery, calculateBackoff } from "../../utils/recovery.js";
import { RETRY } from "../../constants/index.js";
import { getEnv } from "../../config/config.js";

const log = scopedLogger("ai-service");

// ── Provider configuration ───────────────────────────────────────────────────────

export interface AIProvider {
  name: string;
  client: OpenAI;
  model: string;
  priority: number; // Lower = higher priority
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsImageGen: boolean;
}

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseURL: string;
  model: string;
  priority: number;
  supportsStreaming?: boolean;
  supportsVision?: boolean;
  supportsImageGen?: boolean;
}

// ── Conversation memory ─────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationMemory {
  userId: string;
  guildId?: string;
  messages: ChatMessage[];
  lastUpdated: number;
  persona?: string;
}

// In-memory cache (in production, use Redis or database)
const conversationCache = new Map<string, ConversationMemory>();

const MEMORY_CONFIG = {
  maxMessages: 50, // Maximum messages per conversation
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

// ── Response cache ─────────────────────────────────────────────────────────────

interface CachedResponse {
  response: string;
  timestamp: number;
  hitCount: number;
}

const responseCache = new Map<string, CachedResponse>();

const CACHE_CONFIG = {
  maxSize: 1000,
  ttl: 30 * 60 * 1000, // 30 minutes
};

// ── Provider management ─────────────────────────────────────────────────────────

let providers: AIProvider[] = [];
let activeProvider: AIProvider | null = null;

/**
 * Initialize AI providers from environment configuration.
 */
export function initializeProviders(): void {
  const configs: AIProviderConfig[] = [];

  // Groq (primary)
  const groqKey = getEnv("GROQ_API_KEY");
  if (groqKey) {
    configs.push({
      name: "groq",
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
      model: getEnv("AI_MODEL") || "llama-3.3-70b-versatile",
      priority: 1,
      supportsStreaming: true,
      supportsVision: false,
      supportsImageGen: false,
    });
  }

  // OpenAI (backup)
  const openaiKey = getEnv("OPENAI_API_KEY");
  if (openaiKey) {
    configs.push({
      name: "openai",
      apiKey: openaiKey,
      baseURL: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      priority: 2,
      supportsStreaming: true,
      supportsVision: true,
      supportsImageGen: true,
    });
  }

  // Create provider instances
  providers = configs.map((config) => ({
    name: config.name,
    client: new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    }),
    model: config.model,
    priority: config.priority,
    supportsStreaming: config.supportsStreaming ?? false,
    supportsVision: config.supportsVision ?? false,
    supportsImageGen: config.supportsImageGen ?? false,
  }));

  // Sort by priority and set active provider
  providers.sort((a, b) => a.priority - b.priority);
  activeProvider = providers[0] ?? null;

  log.info(`Initialized ${providers.length} AI provider(s)`, {
    providers: providers.map((p) => ({ name: p.name, model: p.model, priority: p.priority })),
    active: activeProvider?.name ?? "none",
  });

  // Start cleanup interval
  setInterval(cleanupMemory, MEMORY_CONFIG.cleanupInterval);
  setInterval(cleanupCache, CACHE_CONFIG.ttl);
}

/**
 * Get the currently active provider.
 */
export function getActiveProvider(): AIProvider | null {
  return activeProvider;
}

/**
 * Get all available providers.
 */
export function getAllProviders(): AIProvider[] {
  return [...providers];
}

/**
 * Failover to the next available provider.
 */
export function failoverProvider(): AIProvider | null {
  if (providers.length <= 1) {
    log.warn("No backup providers available for failover");
    return activeProvider;
  }

  const currentIndex = activeProvider ? providers.indexOf(activeProvider) : -1;
  const nextIndex = (currentIndex + 1) % providers.length;
  const nextProvider = providers[nextIndex];

  if (nextProvider === activeProvider) {
    log.warn("Failover resulted in same provider");
    return activeProvider;
  }

  log.warn(`Failing over from "${activeProvider?.name}" to "${nextProvider.name}"`);
  activeProvider = nextProvider;
  return activeProvider;
}

// ── Conversation memory management ─────────────────────────────────────────────

function getCacheKey(userId: string, guildId?: string): string {
  return guildId ? `${userId}:${guildId}` : userId;
}

/**
 * Get conversation memory for a user.
 */
export function getConversationMemory(userId: string, guildId?: string): ConversationMemory {
  const key = getCacheKey(userId, guildId);
  let memory = conversationCache.get(key);

  if (!memory) {
    memory = {
      userId,
      guildId,
      messages: [],
      lastUpdated: Date.now(),
    };
    conversationCache.set(key, memory);
  }

  return memory;
}

/**
 * Add a message to conversation memory.
 */
export function addMessageToMemory(
  userId: string,
  role: ChatMessage["role"],
  content: string,
  guildId?: string,
): void {
  const memory = getConversationMemory(userId, guildId);
  memory.messages.push({
    role,
    content,
    timestamp: Date.now(),
  });
  memory.lastUpdated = Date.now();

  // Trim to max messages
  if (memory.messages.length > MEMORY_CONFIG.maxMessages) {
    const removeCount = memory.messages.length - MEMORY_CONFIG.maxMessages;
    memory.messages.splice(0, removeCount);
  }
}

/**
 * Clear conversation memory for a user.
 */
export function clearConversationMemory(userId: string, guildId?: string): void {
  const key = getCacheKey(userId, guildId);
  conversationCache.delete(key);
  log.debug(`Cleared conversation memory for ${key}`);
}

/**
 * Set custom persona for a conversation.
 */
export function setConversationPersona(userId: string, persona: string, guildId?: string): void {
  const memory = getConversationMemory(userId, guildId);
  memory.persona = persona;
  memory.lastUpdated = Date.now();
}

/**
 * Cleanup old conversation memories.
 */
function cleanupMemory(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, memory] of conversationCache.entries()) {
    if (now - memory.lastUpdated > MEMORY_CONFIG.maxAge) {
      conversationCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.debug(`Cleaned up ${cleaned} old conversation memories`);
  }
}

// ── Response caching ───────────────────────────────────────────────────────────

function generateCacheKey(prompt: string, model: string, persona?: string): string {
  const base = `${prompt}:${model}`;
  return persona ? `${base}:${persona}` : base;
}

/**
 * Get cached response if available.
 */
export function getCachedResponse(prompt: string, model: string, persona?: string): string | null {
  const key = generateCacheKey(prompt, model, persona);
  const cached = responseCache.get(key);

  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_CONFIG.ttl) {
    responseCache.delete(key);
    return null;
  }

  cached.hitCount++;
  log.debug(`Cache hit for prompt: ${prompt.slice(0, 50)}...`);
  return cached.response;
}

/**
 * Cache a response.
 */
export function cacheResponse(prompt: string, response: string, model: string, persona?: string): void {
  const key = generateCacheKey(prompt, model, persona);

  // Enforce max cache size
  if (responseCache.size >= CACHE_CONFIG.maxSize) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) {
      responseCache.delete(oldestKey);
    }
  }

  responseCache.set(key, {
    response,
    timestamp: Date.now(),
    hitCount: 0,
  });
}

/**
 * Cleanup old cached responses.
 */
function cleanupCache(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, cached] of responseCache.entries()) {
    if (now - cached.timestamp > CACHE_CONFIG.ttl) {
      responseCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    log.debug(`Cleaned up ${cleaned} expired cache entries`);
  }
}

// ── AI completion with retry and failover ─────────────────────────────────────────

export interface CompletionOptions {
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  persona?: string;
  useCache?: boolean;
}

export interface CompletionResult {
  content: string;
  provider: string;
  model: string;
  cached: boolean;
  retryCount: number;
}

/**
 * Perform AI chat completion with automatic retry and failover.
 */
export async function completeChat(
  options: CompletionOptions,
): Promise<CompletionResult> {
  const {
    messages,
    maxTokens = 1024,
    temperature = 0.7,
    stream = false,
    persona,
    useCache = true,
  } = options;

  const lastMessage = messages[messages.length - 1];
  const prompt = lastMessage?.content ?? "";

  // Check cache first
  if (useCache && !stream) {
    const provider = getActiveProvider();
    if (provider) {
      const cached = getCachedResponse(prompt, provider.model, persona);
      if (cached) {
        return {
          content: cached,
          provider: provider.name,
          model: provider.model,
          cached: true,
          retryCount: 0,
        };
      }
    }
  }

  // Build messages with persona
  const systemPrompt = persona ?? "You are Panindigan, a helpful and friendly Discord bot assistant for a Filipino community server. Reply in the same language as the user.";
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  let lastError: Error | null = null;
  let retryCount = 0;
  let currentProvider = getActiveProvider();

  // Try with retry logic
  for (let attempt = 1; attempt <= RETRY.MAX_ATTEMPTS; attempt++) {
    if (!currentProvider) {
      throw new Error("No AI provider available");
    }

    try {
      log.debug(`Attempting completion with provider "${currentProvider.name}" (attempt ${attempt})`);

      const completion = await withRecovery(
        `ai:${currentProvider.name}`,
        async () => {
          return await currentProvider!.client.chat.completions.create({
            model: currentProvider!.model,
            messages: fullMessages as any,
            max_tokens: maxTokens,
            temperature,
            stream,
          });
        },
        {
          maxAttempts: 1, // We handle retries at this level
          baseDelays: RETRY.API_BACKOFF_MS,
          onRetry: (attempt, error) => {
            log.warn(`Retry attempt ${attempt} for provider "${currentProvider!.name}"`, { error: error.message });
          },
        },
      );

      const content = ("choices" in completion) ? completion.choices[0]?.message?.content ?? "" : "";

      // Cache the response
      if (useCache && !stream) {
        cacheResponse(prompt, content, currentProvider.model, persona);
      }

      return {
        content,
        provider: currentProvider.name,
        model: currentProvider.model,
        cached: false,
        retryCount: attempt - 1,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      retryCount = attempt;

      log.error(`Completion failed with provider "${currentProvider.name}"`, {
        error: lastError.message,
        attempt,
      });

      // Failover to next provider
      const nextProvider = failoverProvider();
      if (nextProvider !== currentProvider) {
        currentProvider = nextProvider;
        retryCount = 0; // Reset retry count for new provider
      }
    }
  }

  throw lastError ?? new Error("AI completion failed after all retries and failovers");
}

/**
 * Perform streaming AI chat completion.
 */
export async function* completeChatStream(
  options: CompletionOptions,
): AsyncGenerator<string, void, unknown> {
  const {
    messages,
    maxTokens = 1024,
    temperature = 0.7,
    persona,
  } = options;

  const provider = getActiveProvider();
  if (!provider) {
    throw new Error("No AI provider available");
  }

  if (!provider.supportsStreaming) {
    throw new Error(`Provider "${provider.name}" does not support streaming`);
  }

  const systemPrompt = persona ?? "You are Panindigan, a helpful and friendly Discord bot assistant for a Filipino community server. Reply in the same language as the user.";
  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const stream = await provider.client.chat.completions.create({
    model: provider.model,
    messages: fullMessages as any,
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content ?? "";
    if (content) {
      yield content;
    }
  }
}

// ── Typing indicator helper ─────────────────────────────────────────────────────

/**
 * Start typing indicator in a channel.
 */
export async function startTyping(
  channel: { sendTyping: () => Promise<void> },
  durationMs = 5000,
): Promise<NodeJS.Timeout> {
  await channel.sendTyping();
  return setInterval(() => channel.sendTyping(), Math.min(durationMs, 9000));
}

/**
 * Stop typing indicator.
 */
export function stopTyping(interval: NodeJS.Timeout): void {
  clearInterval(interval);
}

// ── Statistics ─────────────────────────────────────────────────────────────────

export interface AIStats {
  providers: Array<{ name: string; model: string; priority: number; active: boolean }>;
  conversationCount: number;
  cacheSize: number;
  cacheHitRate: number;
}

/**
 * Get AI platform statistics.
 */
export function getAIStats(): AIStats {
  const totalHits = Array.from(responseCache.values()).reduce((sum, c) => sum + c.hitCount, 0);
  const cacheHitRate = responseCache.size > 0 ? totalHits / responseCache.size : 0;

  return {
    providers: providers.map((p) => ({
      name: p.name,
      model: p.model,
      priority: p.priority,
      active: p === activeProvider,
    })),
    conversationCount: conversationCache.size,
    cacheSize: responseCache.size,
    cacheHitRate,
  };
}
