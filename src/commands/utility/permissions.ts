import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "permissions",
  description: "View your permissions in this server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const member = await guild.members.fetch(ctx.userId).catch(() => null);
    if (!member) return;

    const permissions = member.permissions;
    const permList = Object.keys(PermissionFlagsBits)
      .filter((key) => permissions.has(PermissionFlagsBits[key as keyof typeof PermissionFlagsBits]))
      .join(", ") || "None";

    const embed = baseEmbed("primary")
      .setTitle("🔐 Your Permissions")
      .setDescription(permList.slice(0, 4096))
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
