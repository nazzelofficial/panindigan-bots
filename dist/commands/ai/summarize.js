import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGroqClient, getAiModel, isAiConfigured } from "../../features/ai/openaiClient.js";
const command = {
    name: "summarize",
    description: "Summarize a long text using AI",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 10,
    aliases: ["tldr", "summary"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("text").setDescription("Text to summarize").setRequired(true).setMaxLength(3000))
        .addStringOption((o) => o.setName("style").setDescription("Summary style").setRequired(false)
        .addChoices({ name: "Bullet Points", value: "bullets" }, { name: "Short Paragraph", value: "paragraph" }, { name: "One Sentence", value: "sentence" })),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("⚠️ AI service is temporarily unavailable.")] });
            return;
        }
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        const style = ctx.isSlash ? (ctx.interaction.options.getString("style") ?? "bullets") : "bullets";
        if (!text) {
            await ctx.reply({ embeds: [errorEmbed("Please provide text to summarize.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        const stylePhrases = {
            bullets: "Summarize in 3-5 concise bullet points using • for each point.",
            paragraph: "Summarize in a short paragraph of 2-3 sentences.",
            sentence: "Summarize in exactly one sentence.",
        };
        try {
            const groq = getGroqClient();
            const model = getAiModel();
            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: `You are a professional summarizer. ${stylePhrases[style] ?? stylePhrases.bullets} Be concise and accurate.` },
                    { role: "user", content: text },
                ],
                max_tokens: 500, temperature: 0.3,
            });
            const summary = completion.choices[0]?.message?.content ?? "Unable to summarize.";
            const embed = baseEmbed("primary")
                .setTitle("📝 Summary")
                .addFields({ name: "Original (preview)", value: text.length > 300 ? text.slice(0, 300) + "…" : text }, { name: "Summary", value: summary })
                .setFooter({ text: `Style: ${style}` });
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            console.error("[AI] Summarize command error:", err);
            const e = errorEmbed("⚠️ AI service is temporarily unavailable. Please try again in a moment.");
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=summarize.js.map