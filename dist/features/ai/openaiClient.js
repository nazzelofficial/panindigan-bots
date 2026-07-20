import OpenAI from "openai";
import { getEnv } from "../../config/config.js";
let _client = null;
export function isAiConfigured() {
    return Boolean(getEnv("GROQ_API_KEY"));
}
export function getGroqClient() {
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
export function getOpenAiClient() {
    return getGroqClient();
}
export function getAiModel() {
    return getEnv("AI_MODEL") || "llama-3.3-70b-versatile";
}
//# sourceMappingURL=openaiClient.js.map