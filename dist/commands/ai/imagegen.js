import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient.js";
const command = {
    name: "imagegen",
    description: "Generate an image with AI (alias for /image)",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 30,
    aliases: ["ig"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("prompt").setDescription("Describe the image you want to generate").setRequired(true).setMaxLength(800))
        .addStringOption((o) => o.setName("style").setDescription("Art style").setRequired(false)
        .addChoices({ name: "Realistic", value: "realistic" }, { name: "Anime", value: "anime" }, { name: "Digital Art", value: "digital art" }, { name: "Oil Painting", value: "oil painting" }, { name: "Watercolor", value: "watercolor" }, { name: "Pixel Art", value: "pixel art" })),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
            return;
        }
        const basePrompt = ctx.isSlash ? ctx.interaction.options.getString("prompt", true) : ctx.args.join(" ");
        const style = ctx.isSlash ? (ctx.interaction.options.getString("style") ?? "") : "";
        if (!basePrompt) {
            await ctx.reply({ embeds: [errorEmbed("Please describe the image.")] });
            return;
        }
        const fullPrompt = style ? `${basePrompt}, ${style} style` : basePrompt;
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const openai = getOpenAiClient();
            const response = await openai.images.generate({
                model: "dall-e-3", prompt: fullPrompt, n: 1, size: "1024x1024",
            });
            const url = response.data[0]?.url;
            if (!url)
                throw new Error("No image URL returned.");
            const embed = baseEmbed("primary")
                .setTitle("🎨 AI Image Generated")
                .setDescription(`**Prompt:** ${fullPrompt.length > 200 ? fullPrompt.slice(0, 200) + "…" : fullPrompt}`)
                .setImage(url)
                .setFooter({ text: "Powered by DALL-E 3" });
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed] });
            else
                await ctx.reply({ embeds: [embed] });
        }
        catch (err) {
            const e = errorEmbed(`Image generation failed: ${err.message}`);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=imagegen.js.map