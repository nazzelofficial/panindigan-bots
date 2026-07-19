import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";

const command: CommandDefinition = {
  name: "automod_enable",
  description: "Enable auto-moderation",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { automod: { ...((await GuildModel.findOne({ guildId: guild.id }))?.automod || {}), enabled: true } },
      { upsert: true }
    );

    await ctx.reply({ content: "✅ Auto-moderation enabled" });
  },
};
export default command;
