import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";

const command: CommandDefinition = {
  name: "embedbuilder",
  description: "Build a custom embed",
  category: "Utility",
  access: "admin",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("title").setDescription("Embed title").setRequired(true))
      .addStringOption((o) => o.setName("description").setDescription("Embed description").setRequired(false))
      .addStringOption((o) => o.setName("color").setDescription("Embed color (hex)").setRequired(false)),
  async execute(ctx) {
    const title = ctx.isSlash ? ctx.interaction!.options.getString("title", true) : ctx.args[0];
    const description = ctx.isSlash ? ctx.interaction!.options.getString("description") : ctx.args.slice(1).join(" ");
    const color = ctx.isSlash ? ctx.interaction!.options.getString("color") : ctx.args[2];

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description ?? "")
      .setColor((color ?? "#00ff00") as any)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
