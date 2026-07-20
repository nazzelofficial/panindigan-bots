import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { getOpenAiClient, isAiConfigured } from "../../features/ai/openaiClient.js";
const command = {
    name: "texttoimage",
    description: "Convert a text description to an image (DALL-E)",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 30,
    aliases: ["txt2img", "t2i"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("description").setDescription("Detailed description of the image").setRequired(true).setMaxLength(1000))
        .addStringOption((o) => o.setName("style").setDescription("Visual style").setRequired(false)
        .addChoices({ name: "Photorealistic", value: "photorealistic, 8K, high detail" }, { name: "Cartoon", value: "cartoon style, colorful" }, { name: "Sketch", value: "pencil sketch, black and white" }, { name: "Cinematic", value: "cinematic shot, dramatic lighting" }, { name: "Fantasy", value: "fantasy art, magical, epic" })),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
            return;
        }
        const desc = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.join(" ");
        const style = ctx.isSlash ? (ctx.interaction.options.getString("style") ?? "") : "";
        if (!desc) {
            await ctx.reply({ embeds: [errorEmbed("Please provide an image description.")] });
            return;
        }
        const fullPrompt = style ? `${desc}, ${style}` : desc;
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const openai = getOpenAiClient();
            const response = await openai.images.generate({
                model: "dall-e-3", prompt: fullPrompt, n: 1, size: "1024x1024", quality: "standard",
            });
            const url = response.data[0]?.url;
            if (!url)
                throw new Error("No image URL returned.");
            const embed = baseEmbed("primary")
                .setTitle("🖼️ Text to Image")
                .setDescription(`**Description:** ${desc.length > 200 ? desc.slice(0, 200) + "…" : desc}`)
                .setImage(url)
                .setFooter({ text: `${style ? `Style: ${style} • ` : ""}Powered by DALL-E 3` });
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
//# sourceMappingURL=texttoimage.js.map