import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "categorylist",
  description: "List all categories in the server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const categories = guild.channels.cache.filter((c) => (c as any).isCategoryBased?.()).map((c) => c.name).join(", ") || "None";

    if (!categories || categories === "None") {
      await ctx.reply({ embeds: [infoEmbed("No categories in this server.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("📁 Category List")
      .setDescription(categories)
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
