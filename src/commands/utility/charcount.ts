import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "charcount",
  description: "Count characters in text",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("text").setDescription("Text to count").setRequired(true)),
  async execute(ctx) {
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    const count = text.length;

    const embed = baseEmbed("primary")
      .setTitle("📝 Character Count")
      .setDescription(`**${count}** characters`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
