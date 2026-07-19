import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "binary",
  description: "Convert text to binary",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("text").setDescription("Text to convert").setRequired(true)),
  async execute(ctx) {
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    const binary = text.split("").map((char) => char.charCodeAt(0).toString(2)).join(" ");

    await ctx.reply({ embeds: [infoEmbed(`💻 Binary: \`${binary}\``)] });
  },
};
export default command;
