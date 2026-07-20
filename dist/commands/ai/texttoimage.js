import { errorEmbed } from "../../utils/embeds.js";
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
        await ctx.reply({ embeds: [errorEmbed("⚠️ Image generation is not available with the current AI provider. This feature requires a provider that supports image generation.")] });
    },
};
export default command;
//# sourceMappingURL=texttoimage.js.map