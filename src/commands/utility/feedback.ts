import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "feedback",
  description: "Send feedback to the bot developer",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("message").setDescription("Your feedback").setRequired(true)),
  async execute(ctx) {
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.join(" ");

    if (!message) {
      await ctx.reply({ embeds: [errorEmbed("Please provide feedback.")] });
      return;
    }

    await ctx.reply({ embeds: [successEmbed("✅ Thank you for your feedback! It has been sent to the developer.")] });
  },
};
export default command;
