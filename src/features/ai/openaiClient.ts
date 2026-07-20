import OpenAI from "openai";
import { getEnv } from "../../config/config.js";

let _client: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(getEnv("GROQ_API_KEY"));
}

export function getGroqClient(): OpenAI {
  if (!isAiConfigured()) {
    throw new Error("AI features aren't configured yet — set GROQ_API_KEY.");
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey: getEnv("GROQ_API_KEY"),
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return _client;
}

// Legacy alias for compatibility
export function getOpenAiClient(): OpenAI {
  return getGroqClient();
}

export function getAiModel(): string {
  return getEnv("AI_MODEL") || "llama-3.3-70b-versatile";
}
