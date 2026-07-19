import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { getOpenAiClient, isAiConfigured } from "@/features/ai/openaiClient";

const command: CommandDefinition = {
  name: "summarize",
  description: "Summarize a long text using AI",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 10,
  aliases: ["tldr", "summary"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("text").setDescription("Text to summarize").setRequired(true).setMaxLength(3000))
      .addStringOption((o) => o.setName("style").setDescription("Summary style").setRequired(false)
        .addChoices(
          { name: "Bullet Points", value: "bullets" },
          { name: "Short Paragraph", value: "paragraph" },
          { name: "One Sentence", value: "sentence" },
        )),
  async execute(ctx) {
    if (!isAiConfigured()) {
      await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
      return;
    }
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    const style = ctx.isSlash ? (ctx.interaction!.options.getString("style") ?? "bullets") : "bullets";
    if (!text) { await ctx.reply({ embeds: [errorEmbed("Please provide text to summarize.")] }); return; }

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    const stylePhrases: Record<string, string> = {
      bullets: "Summarize in 3-5 concise bullet points using • for each point.",
      paragraph: "Summarize in a short paragraph of 2-3 sentences.",
      sentence: "Summarize in exactly one sentence.",
    };

    try {
      const openai = getOpenAiClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `You are a professional summarizer. ${stylePhrases[style] ?? stylePhrases.bullets} Be concise and accurate.` },
          { role: "user", content: text },
        ],
        max_tokens: 500, temperature: 0.3,
      });
      const summary = completion.choices[0]?.message?.content ?? "Unable to summarize.";
      const embed = baseEmbed("primary")
        .setTitle("📝 Summary")
        .addFields(
          { name: "Original (preview)", value: text.length > 300 ? text.slice(0, 300) + "…" : text },
          { name: "Summary", value: summary },
        )
        .setFooter({ text: `Style: ${style}` });
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [embed] });
      else await ctx.reply({ embeds: [embed] });
    } catch (err: any) {
      const e = errorEmbed(`Summarization failed: ${err.message}`);
      if (ctx.isSlash) await ctx.interaction!.editReply({ embeds: [e] }).catch(() => {});
      else await ctx.reply({ embeds: [e] });
    }
  },
};
export default command;
