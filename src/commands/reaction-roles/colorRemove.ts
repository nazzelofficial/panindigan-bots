import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "colorremove",
  description: "Remove a color role from the color chooser panel",
  category: "Reaction Roles",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addRoleOption((o) => o.setName("role").setDescription("Color role to remove from the chooser").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[0]?.replace(/\D/g, "");
    if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "colorRoles.roleIds": roleId } });
    await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> removed from the color chooser.`)] });
  },
};
export default command;
