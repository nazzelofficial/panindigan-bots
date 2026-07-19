import OpenAI from "openai";
import { getEnv } from "@/config/config";
let _client = null;
export function isAiConfigured() {
    return Boolean(getEnv("OPENAI_API_KEY"));
}
export function getOpenAiClient() {
    if (!isAiConfigured()) {
        throw new Error("AI features aren't configured yet — set OPENAI_API_KEY.");
    }
    if (!_client) {
        _client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
    }
    return _client;
}
//# sourceMappingURL=openaiClient.js.map