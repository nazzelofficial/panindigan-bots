import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getGroqClient, getAiModel, isAiConfigured } from "../../features/ai/openaiClient.js";
const command = {
    name: "grammar",
    description: "Check and fix grammar in your text",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 8,
    aliases: ["grammarcheck", "spellcheck"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("text").setDescription("Text to grammar-check").setRequired(true).setMaxLength(1000))
        .addBooleanOption((o) => o.setName("explain").setDescription("Explain the corrections?").setRequired(false)),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("⚠️ AI service is temporarily unavailable.")] });
            return;
        }
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        const explain = ctx.isSlash ? (ctx.interaction.options.getBoolean("explain") ?? false) : false;
        if (!text) {
            await ctx.reply({ embeds: [errorEmbed("Please provide text to check.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const groq = getGroqClient();
            const model = getAiModel();
            const sysPrompt = explain
                ? "You are a grammar expert. Check the text for errors and return: 1) Corrected text, 2) A list of corrections with brief explanations. Format: CORRECTED:\n...\n\nCORRECTIONS:\n..."
                : "Correct all grammar, spelling, and punctuation errors in the text. Return ONLY the corrected text with no extra explanation.";
            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: sysPrompt },
                    { role: "user", content: text },
                ],
                max_tokens: 600,
                temperature: 0.1,
            });
            const result = completion.choices[0]?.message?.content ?? text;
            const embed = baseEmbed("success")
                .setTitle("✅ Grammar Check")
                .addFields({ name: "Original", value: text.length > 400 ? text.slice(0, 400) + "…" : text }, { name: "Corrected", value: result.length > 600 ? result.slice(0, 600) + "…" : result });
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            console.error("[AI] Grammar command error:", err);
            const e = errorEmbed("⚠️ AI service is temporarily unavailable. Please try again in a moment.");
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=grammar.js.map