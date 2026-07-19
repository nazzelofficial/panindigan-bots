import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";
import { GuildModel } from "@/database/models/Guild";

const command: CommandDefinition = {
  name: "aiclear",
  description: "Clear the AI conversation history for this server",
  category: "AI",
  access: "admin",
  guildOnly: true,
  cooldown: 10,
  aliases: ["clearai", "resetai"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $unset: { aiConversationHistory: 1 } },
      { upsert: false },
    );
    await ctx.reply({ embeds: [successEmbed("🗑️ AI conversation history cleared for this server.")] });
  },
};
export default command;
