import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGroqClient, getAiModel, isAiConfigured } from "../../features/ai/openaiClient.js";

const command: CommandDefinition = {
  name: "rewrite",
  description: "Rewrite text in a different tone or style",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 8,
  aliases: ["rephrase", "paraphrase"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("text").setDescription("Text to rewrite").setRequired(true).setMaxLength(800))
      .addStringOption((o) => o.setName("tone").setDescription("Target tone").setRequired(false)
        .addChoices(
          { name: "Professional", value: "professional" },
          { name: "Casual/Friendly", value: "casual" },
          { name: "Formal", value: "formal" },
          { name: "Persuasive", value: "persuasive" },
          { name: "Simple/Easy", value: "simple" },
          { name: "Creative", value: "creative" },
        )),
  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("⚠️ AI service is temporarily unavailable.")] });
      return;
    }
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    const tone = ctx.isSlash ? (ctx.interaction!.options.getString("tone") ?? "professional") : "professional";
    if (!text) { await ctx.reply({ embeds: [errorEmbed("Please provide text to rewrite.")] }); return; }

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    const toneDescs: Record<string, string> = {
      professional: "professional and polished",
      casual: "casual, friendly, and conversational",
      formal: "highly formal and academic",
      persuasive: "persuasive and compelling",
      simple: "simple, clear, and easy to understand",
      creative: "creative and engaging",
    };

    try {
      const groq = getGroqClient();
      const model = getAiModel();
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: `Rewrite the given text in a ${toneDescs[tone] ?? tone} tone. Keep the same meaning but change the wording. Return ONLY the rewritten text.` },
          { role: "user", content: text },
        ],
        max_tokens: 600, temperature: 0.5,
      });
      const rewritten = completion.choices[0]?.message?.content ?? text;
      const embed = baseEmbed("primary")
        .setTitle("✏️ Rewritten Text")
        .addFields(
          { name: "Original", value: text.length > 400 ? text.slice(0, 400) + "…" : text },
          { name: `Rewritten (${tone})`, value: rewritten.length > 600 ? rewritten.slice(0, 600) + "…" : rewritten },
        );
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
      else await ctx.reply({ embeds: [embed] });
    } catch (err: any) {
      console.error("[AI] Rewrite command error:", err);
      const e = errorEmbed("⚠️ AI service is temporarily unavailable. Please try again in a moment.");
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [e] }).catch(() => {});
      else await ctx.reply({ embeds: [e] });
    }
  },
};
export default command;
