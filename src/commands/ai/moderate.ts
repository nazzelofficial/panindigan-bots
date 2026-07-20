import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "moderate",
  description: "Check text for harmful content using AI moderation",
  category: "AI",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  aliases: ["aimoderate", "checktext"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("text").setDescription("Text to moderate").setRequired(true).setMaxLength(2000)),
  async execute(ctx) {
    await ctx.reply({ embeds: [errorEmbed("⚠️ Content moderation is not available with the current AI provider. This feature requires a provider that supports content moderation APIs.")] });
  },
};
export default command;
