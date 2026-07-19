import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "leveluptoggle",
  description: "Enable or disable level-up announcement messages",
  category: "Leveling",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["levelupnotif"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable level-up notifications").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.levelUpNotifications": enabled } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Level-up notifications **${enabled ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
