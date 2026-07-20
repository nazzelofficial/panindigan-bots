import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient.js";
const LANGUAGES = {
    en: "English", fil: "Filipino/Tagalog", es: "Spanish", fr: "French",
    de: "German", ja: "Japanese", ko: "Korean", zh: "Chinese (Simplified)",
    ar: "Arabic", pt: "Portuguese", it: "Italian", ru: "Russian",
    hi: "Hindi", vi: "Vietnamese", th: "Thai",
};
const command = {
    name: "translate",
    description: "Translate text to another language using AI",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 8,
    aliases: ["tr", "trans"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("text").setDescription("Text to translate").setRequired(true).setMaxLength(800))
        .addStringOption((o) => o.setName("to").setDescription("Target language").setRequired(true)
        .addChoices(...Object.entries(LANGUAGES).map(([v, n]) => ({ name: n, value: v }))))
        .addStringOption((o) => o.setName("from").setDescription("Source language (auto-detect if not set)").setRequired(false)
        .addChoices(...Object.entries(LANGUAGES).map(([v, n]) => ({ name: n, value: v })))),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
            return;
        }
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.slice(1).join(" ");
        const to = ctx.isSlash ? ctx.interaction.options.getString("to", true) : (ctx.args[0] ?? "en");
        const from = ctx.isSlash ? (ctx.interaction.options.getString("from") ?? "auto") : "auto";
        if (!text) {
            await ctx.reply({ embeds: [errorEmbed("Please provide text to translate.")] });
            return;
        }
        const targetLang = LANGUAGES[to] ?? to;
        const sourceLang = LANGUAGES[from] ?? (from === "auto" ? "auto-detected" : from);
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const openai = getOpenAiClient();
            const sysMsg = from === "auto"
                ? `Translate the following text to ${targetLang}. Return ONLY the translated text.`
                : `Translate the following text from ${sourceLang} to ${targetLang}. Return ONLY the translated text.`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: sysMsg }, { role: "user", content: text }],
                max_tokens: 600, temperature: 0.1,
            });
            const translated = completion.choices[0]?.message?.content ?? text;
            const embed = baseEmbed("primary")
                .setTitle("🌐 Translation")
                .addFields({ name: `Original (${sourceLang})`, value: text.length > 400 ? text.slice(0, 400) + "…" : text }, { name: `Translated (${targetLang})`, value: translated.length > 600 ? translated.slice(0, 600) + "…" : translated });
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            const e = errorEmbed(`Translation failed: ${err.message}`);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=translate.js.map