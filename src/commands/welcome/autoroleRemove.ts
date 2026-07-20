import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "autoroleremove",
  description: "Remove a role from the auto-role list",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  aliases: ["removeautorole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addRoleOption((o) => o.setName("role").setDescription("Role to remove from auto-assign").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const roleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("role", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { autoRoleIds: roleId } });
    await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> removed from auto-roles.`)] });
  },
};
export default command;
