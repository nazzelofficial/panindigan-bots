import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { isAiConfigured, getGroqClient, getAiModel } from "../../features/ai/openaiClient.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
import { UserModel } from "../../database/models/User.js";
import { GuildModel } from "../../database/models/Guild.js";
import { getConfig } from "../../config/config.js";
import { apiLog } from "../../utils/logger.js";

// Per-user conversation history: userId → messages[]
const chatHistory = new Map<string, Array<{ role: string; content: string }>>();

/** Classify AI errors into user-friendly messages. */
function describeAiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("insufficient_quota") || msg.includes("billing"))   return "❌ AI service quota exceeded — the account has run out of credits.";
  if (msg.includes("rate_limit"))                                       return "⏳ AI service is busy right now — please try again in a few seconds.";
  if (msg.includes("context_length") || msg.includes("maximum"))       return "❌ Your message is too long for the AI to process. Please shorten it.";
  if (msg.includes("content_policy") || msg.includes("safety"))        return "🚫 Your request was blocked by the AI's content policy.";
  if (msg.includes("timeout") || msg.includes("ECONNRESET"))           return "⏳ AI service timed out — please try again.";
  return "⚠️ AI service is temporarily unavailable. Please try again in a moment.";
}

const command: CommandDefinition = {
  name: "ai",
  description: "AI features — chat, image, translate, summarize, code, and more",
  category: "AI",
  access: "general",
  cooldown: 5,
  premium: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("chat").setDescription("Chat with the AI")
          .addStringOption((o) => o.setName("message").setDescription("Your message").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("image").setDescription("Analyze an image (Premium)")
          .addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(true))
          .addStringOption((o) => o.setName("question").setDescription("What to ask about the image").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("translate").setDescription("Translate text (Premium)")
          .addStringOption((o) => o.setName("text").setDescription("Text to translate").setRequired(true))
          .addStringOption((o) => o.setName("language").setDescription("Target language e.g. Filipino, Japanese").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("summarize").setDescription("Summarize text (Premium)")
          .addStringOption((o) => o.setName("text").setDescription("Text to summarize").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("code").setDescription("Generate code (Premium)")
          .addStringOption((o) => o.setName("prompt").setDescription("What code to generate").setRequired(true))
          .addStringOption((o) => o.setName("language").setDescription("Programming language").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("imagegen").setDescription("Generate an image from a prompt (Premium)")
          .addStringOption((o) => o.setName("prompt").setDescription("Image description").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("clear").setDescription("Clear your AI chat history"))
      .addSubcommand((s) => s.setName("stats").setDescription("View your AI usage stats")),

  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("⚠️ AI service is temporarily unavailable.")] });
      return;
    }

    const sub    = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "chat";
    const config = getConfig();
    const groq = getGroqClient();
    const model = getAiModel();

    // Usage limit check
    const doc         = await UserModel.findOne({ userId: ctx.userId }).lean();
    const aiUsedToday = (doc as any)?.aiMessagesUsedToday ?? 0;
    const aiResetAt   = (doc as any)?.aiUsageResetAt ? new Date((doc as any).aiUsageResetAt) : null;
    const isNewDay    = !aiResetAt || Date.now() > aiResetAt.getTime();
    const used        = isNewDay ? 0 : aiUsedToday;
    const limit       = 20;
    if (used >= limit && !["clear", "stats"].includes(sub)) {
      await ctx.reply({ embeds: [errorEmbed(`You've used all **${limit}** AI messages for today. Resets <t:${Math.floor(((aiResetAt?.getTime() ?? 0) + 86_400_000) / 1000)}:R>.`)] });
      return;
    }

    const guild      = ctx.interaction?.guild ?? ctx.message?.guild;
    const guildCfg   = guild ? await GuildModel.findOne({ guildId: guild.id }).lean() : null;
    const personaPrompt = (guildCfg as any)?.aiPersona?.systemPrompt
      ?? "You are Panindigan, a helpful and friendly Discord bot assistant for a Filipino community server. Reply in the same language as the user.";

    const bumpUsage = async () => {
      await UserModel.findOneAndUpdate(
        { userId: ctx.userId },
        { $set: { aiMessagesUsedToday: used + 1, aiUsageResetAt: isNewDay ? new Date(Date.now() + 86_400_000) : (doc as any)?.aiUsageResetAt } },
        { upsert: true },
      ).catch(() => null);
    };

    // ── chat ─────────────────────────────────────────────────────────────────
    if (sub === "chat") {
      const userMsg = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.slice(1).join(" ");
      if (!userMsg) { await ctx.reply({ embeds: [errorEmbed("Provide a message.")] }); return; }

      const history = chatHistory.get(ctx.userId) ?? [];
      history.push({ role: "user", content: userMsg });
      if (history.length > 20) history.splice(0, history.length - 20);

      const t0 = Date.now();
      let completion;
      try {
        completion = await groq.chat.completions.create({
          model,
          messages:   [{ role: "system", content: personaPrompt }, ...history as any],
          max_tokens: 1024,
        });
        apiLog.info("Groq chat completion", { userId: ctx.userId, ms: Date.now() - t0, model });
      } catch (err) {
        console.error("[AI] Chat error:", err);
        apiLog.error("Groq chat error", { error: err instanceof Error ? err.message : String(err) });
        await ctx.reply({ embeds: [errorEmbed(describeAiError(err))] });
        return;
      }

      const reply = completion.choices[0]?.message?.content ?? "No response.";
      history.push({ role: "assistant", content: reply });
      chatHistory.set(ctx.userId, history);
      await bumpUsage();

      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("🤖 AI Chat")
            .setDescription(reply.slice(0, 4000))
            .setFooter({ text: `${used + 1}/${limit} messages today` }),
        ],
      });

    // ── translate ─────────────────────────────────────────────────────────────
    } else if (sub === "translate") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.slice(2).join(" ");
      const lang = ctx.isSlash ? ctx.interaction!.options.getString("language", true) : ctx.args[1];
      if (!text || !lang) { await ctx.reply({ embeds: [errorEmbed("Provide text and target language.")] }); return; }

      let res;
      try {
        res = await groq.chat.completions.create({
          model,
          messages:   [{ role: "system", content: `You are a translator. Translate the user's text to ${lang}. Output ONLY the translation, no explanation.` }, { role: "user", content: text }],
          max_tokens: 1024,
        });
        await bumpUsage();
      } catch (err) {
        console.error("[AI] Translate error:", err);
        apiLog.error("Groq translate error", { error: err instanceof Error ? err.message : String(err) });
        await ctx.reply({ embeds: [errorEmbed(describeAiError(err))] });
        return;
      }
      const translated = res.choices[0]?.message?.content ?? "No response.";
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle(`🌐 Translation → ${lang}`).addFields({ name: "Original", value: text.slice(0, 1000) }, { name: "Translation", value: translated.slice(0, 1000) })] });

    // ── summarize ─────────────────────────────────────────────────────────────
    } else if (sub === "summarize") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.slice(1).join(" ");
      if (!text) { await ctx.reply({ embeds: [errorEmbed("Provide text to summarize.")] }); return; }

      let res;
      try {
        res = await groq.chat.completions.create({
          model,
          messages:   [{ role: "system", content: "Summarize the following text concisely in bullet points." }, { role: "user", content: text }],
          max_tokens: 512,
        });
        await bumpUsage();
      } catch (err) {
        console.error("[AI] Summarize error:", err);
        apiLog.error("Groq summarize error", { error: err instanceof Error ? err.message : String(err) });
        await ctx.reply({ embeds: [errorEmbed(describeAiError(err))] });
        return;
      }
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📝 Summary").setDescription(res.choices[0]?.message?.content?.slice(0, 4000) ?? "No response.")] });

    // ── code ──────────────────────────────────────────────────────────────────
    } else if (sub === "code") {
      const prompt = ctx.isSlash ? ctx.interaction!.options.getString("prompt", true) : ctx.args.slice(1).join(" ");
      const lang   = ctx.isSlash ? ctx.interaction!.options.getString("language") ?? "any language" : "TypeScript";
      if (!prompt) { await ctx.reply({ embeds: [errorEmbed("Provide a code prompt.")] }); return; }

      let res;
      try {
        res = await groq.chat.completions.create({
          model,
          messages:   [{ role: "system", content: `You are an expert programmer. Generate clean, well-commented ${lang} code. Format code in a code block.` }, { role: "user", content: prompt }],
          max_tokens: 1500,
        });
        await bumpUsage();
      } catch (err) {
        console.error("[AI] Code error:", err);
        apiLog.error("Groq code error", { error: err instanceof Error ? err.message : String(err) });
        await ctx.reply({ embeds: [errorEmbed(describeAiError(err))] });
        return;
      }
      const code = res.choices[0]?.message?.content ?? "No response.";
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle(`💻 Code — ${lang}`).setDescription(code.slice(0, 4000))] });

    // ── imagegen ──────────────────────────────────────────────────────────────
    } else if (sub === "imagegen") {
      await ctx.reply({ embeds: [errorEmbed("⚠️ Image generation is not available with the current AI provider. This feature requires a provider that supports image generation.")] });

    // ── image analysis ────────────────────────────────────────────────────────
    } else if (sub === "image") {
      await ctx.reply({ embeds: [errorEmbed("⚠️ Image analysis is not available with the current AI provider. This feature requires a provider that supports vision/image analysis.")] });

    // ── clear ─────────────────────────────────────────────────────────────────
    } else if (sub === "clear") {
      chatHistory.delete(ctx.userId);
      await ctx.reply({ embeds: [baseEmbed("success").setDescription("✅ Your AI chat history has been cleared.")] });

    // ── stats ─────────────────────────────────────────────────────────────────
    } else if (sub === "stats") {
      const d       = await UserModel.findOne({ userId: ctx.userId }).lean();
      const used2   = (d as any)?.aiMessagesUsedToday ?? 0;
      const resetAt = (d as any)?.aiUsageResetAt ? new Date((d as any).aiUsageResetAt) : null;
      const histLen = chatHistory.get(ctx.userId)?.length ?? 0;
      await ctx.reply({
        embeds: [
          baseEmbed("primary").setTitle("📊 AI Usage Stats").addFields(
            { name: "Messages Used Today", value: `${used2} / ${limit}`, inline: true },
            { name: "Chat History",        value: `${histLen} messages in memory`, inline: true },
            { name: "Reset",               value: resetAt ? `<t:${Math.floor(resetAt.getTime() / 1000)}:R>` : "N/A", inline: true },
          ),
        ],
      });

    } else {
      await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: chat | translate | summarize | code | imagegen | image | clear | stats")] });
    }
  },
};
export default command;
