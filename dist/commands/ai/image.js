import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { getOpenAiClient, isAiConfigured } from "@/features/ai/openaiClient";
const command = {
    name: "image",
    description: "Generate an image with AI (DALL-E 3)",
    category: "AI",
    access: "general",
    guildOnly: false,
    cooldown: 30,
    aliases: ["imagecreate", "createimage"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("prompt").setDescription("Image description").setRequired(true).setMaxLength(800))
        .addStringOption((o) => o.setName("size").setDescription("Image size").setRequired(false)
        .addChoices({ name: "Square (1024x1024)", value: "1024x1024" }, { name: "Landscape (1792x1024)", value: "1792x1024" }, { name: "Portrait (1024x1792)", value: "1024x1792" }))
        .addStringOption((o) => o.setName("quality").setDescription("Image quality").setRequired(false)
        .addChoices({ name: "Standard", value: "standard" }, { name: "HD", value: "hd" })),
    async execute(ctx) {
        if (!isAiConfigured()) {
            await ctx.reply({ embeds: [errorEmbed("AI features aren't configured — set `OPENAI_API_KEY`.")] });
            return;
        }
        const prompt = ctx.isSlash ? ctx.interaction.options.getString("prompt", true) : ctx.args.join(" ");
        const size = (ctx.isSlash ? ctx.interaction.options.getString("size") : null) ?? "1024x1024";
        const quality = (ctx.isSlash ? ctx.interaction.options.getString("quality") : null) ?? "standard";
        if (!prompt) {
            await ctx.reply({ embeds: [errorEmbed("Please describe the image you want.")] });
            return;
        }
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        try {
            const openai = getOpenAiClient();
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: size,
                quality: quality,
            });
            const url = response.data[0]?.url;
            if (!url)
                throw new Error("No image URL returned.");
            const embed = baseEmbed("primary")
                .setTitle("🎨 Generated Image")
                .setDescription(`**Prompt:** ${prompt.length > 200 ? prompt.slice(0, 200) + "…" : prompt}`)
                .setImage(url)
                .setFooter({ text: `Size: ${size} • Quality: ${quality} • Powered by DALL-E 3` });
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
//# sourceMappingURL=image.js.map