import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "serverlock_status",
  description: "Check server lockdown status",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const config = await GuildModel.findOne({ guildId: guild.id });
    const isLocked = config?.locked || false;

    const embed = baseEmbed(isLocked ? "danger" : "success")
      .setTitle("🔒 Server Lockdown Status")
      .setDescription(isLocked ? "🔒 Server is locked down" : "🔓 Server is not locked")
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
