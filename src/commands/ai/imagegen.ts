import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "imagegen",
  description: "Generate an image with AI (alias for /image)",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 30,
  aliases: ["ig"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("prompt").setDescription("Describe the image you want to generate").setRequired(true).setMaxLength(800))
      .addStringOption((o) => o.setName("style").setDescription("Art style").setRequired(false)
        .addChoices(
          { name: "Realistic", value: "realistic" },
          { name: "Anime", value: "anime" },
          { name: "Digital Art", value: "digital art" },
          { name: "Oil Painting", value: "oil painting" },
          { name: "Watercolor", value: "watercolor" },
          { name: "Pixel Art", value: "pixel art" },
        )),
  async execute(ctx) {
    await ctx.reply({ embeds: [errorEmbed("⚠️ Image generation is not available with the current AI provider. This feature requires a provider that supports image generation.")] });
  },
};
export default command;
