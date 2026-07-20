import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "image",
  description: "Generate an image with AI (DALL-E 3)",
  category: "AI",
  access: "general",
  guildOnly: false,
  cooldown: 30,
  aliases: ["imagecreate", "createimage"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("prompt").setDescription("Image description").setRequired(true).setMaxLength(800))
      .addStringOption((o) => o.setName("size").setDescription("Image size").setRequired(false)
        .addChoices(
          { name: "Square (1024x1024)", value: "1024x1024" },
          { name: "Landscape (1792x1024)", value: "1792x1024" },
          { name: "Portrait (1024x1792)", value: "1024x1792" },
        ))
      .addStringOption((o) => o.setName("quality").setDescription("Image quality").setRequired(false)
        .addChoices({ name: "Standard", value: "standard" }, { name: "HD", value: "hd" })),
  async execute(ctx) {
    await ctx.reply({ embeds: [errorEmbed("⚠️ Image generation is not available with the current AI provider. This feature requires a provider that supports image generation.")] });
  },
};
export default command;
