import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "shop_clear",
  description: "Clear the shop (admin only)",
  category: "Economy",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    // Note: This command uses ShopModel which may not exist in the current schema
    // For now, we'll return an error indicating the shop system needs to be updated
    await ctx.reply({ embeds: [errorEmbed("❌ Shop system is being updated. Please use /shop remove instead.")] });
  },
};
export default command;
