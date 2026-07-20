import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient.js";
const command = {
    name: "moderate",
    description: "Check text for harmful content using AI moderation",
    category: "AI",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["aimoderate", "checktext"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("text").setDescription("Text to moderate").setRequired(true).setMaxLength(2000)),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
            return;
        }
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        if (!text) {
            await ctx.reply({ embeds: [errorEmbed("Please provide text to moderate.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply({ ephemeral: true });
        try {
            const openai = getOpenAiClient();
            const result = await openai.moderations.create({ model: "omni-moderation-latest", input: text });
            const item = result.results[0];
            const flagged = item.flagged;
            const categories = item.categories;
            const scores = item.category_scores;
            const triggeredCats = Object.entries(categories)
                .filter(([, v]) => v)
                .map(([k]) => `\`${k}\` (${(scores[k] * 100).toFixed(1)}%)`);
            const safeScore = Math.round((1 - Math.max(...Object.values(scores))) * 100);
            const embed = baseEmbed(flagged ? "danger" : "success")
                .setTitle(flagged ? "⚠️ Content Flagged" : "✅ Content Safe")
                .addFields({ name: "Text (preview)", value: text.length > 200 ? text.slice(0, 200) + "…" : text }, { name: "Verdict", value: flagged ? `**FLAGGED** — ${triggeredCats.join(", ")}` : `**Clean** — safety score ${safeScore}%` })
                .setFooter({ text: "Powered by OpenAI Moderation API" });
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            const e = errorEmbed(`Moderation check failed: ${err.message}`);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=moderate.js.map