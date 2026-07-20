import OpenAI from "openai";
import { getEnv } from "../../config/config.js";

let _client: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(getEnv("OPENAI_API_KEY"));
}

export function getOpenAiClient(): OpenAI {
  if (!isAiConfigured()) {
    throw new Error("AI features aren't configured yet — set OPENAI_API_KEY.");
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
  }
  return _client;
}
