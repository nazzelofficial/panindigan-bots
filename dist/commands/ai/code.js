import { baseEmbed, errorEmbed } from "../../utils/embeds";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient";
const command = {
    name: "code",
    description: "Generate code with AI based on a description",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 10,
    aliases: ["codegen"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("prompt").setDescription("What code do you want to generate?").setRequired(true).setMaxLength(800))
        .addStringOption((o) => o.setName("language").setDescription("Programming language (default: auto-detect)").setRequired(false)),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured yet — set `OPENAI_API_KEY`.")] });
            return;
        }
        const prompt = ctx.isSlash ? ctx.interaction.options.getString("prompt", true) : ctx.args.join(" ");
        const lang = ctx.isSlash ? (ctx.interaction.options.getString("language") ?? "") : "";
        if (!prompt) {
            await ctx.reply({ embeds: [errorEmbed("Please describe what code you want.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const openai = getOpenAiClient();
            const systemMsg = `You are an expert programmer. Generate clean, well-commented code. ${lang ? `Use ${lang}.` : "Choose the best language for the task."} Return ONLY the code block, no extra explanation.`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: prompt },
                ],
                max_tokens: 1500,
                temperature: 0.2,
            });
            const result = completion.choices[0]?.message?.content ?? "// No code generated";
            const truncated = result.length > 1800 ? result.slice(0, 1800) + "\n// ... (truncated)" : result;
            const embed = baseEmbed("primary")
                .setTitle("💻 Generated Code")
                .setDescription(`**Prompt:** ${prompt.length > 150 ? prompt.slice(0, 150) + "…" : prompt}\n\`\`\`\n${truncated}\n\`\`\``);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            const e = errorEmbed(`Code generation failed: ${err.message}`);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=code.js.map