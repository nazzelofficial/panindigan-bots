import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "autoroleadd",
  description: "Add a role to be automatically assigned to new members when they join",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  aliases: ["addautorole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addRoleOption((o) => o.setName("role").setDescription("Role to auto-assign").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const roleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("role", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] }); return; }
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    if ((cfg as any)?.autoRoleIds?.includes(roleId)) {
      await ctx.reply({ embeds: [errorEmbed(`<@&${roleId}> is already an auto-role.`)] }); return;
    }
    const botMember = guild.members.cache.get(ctx.client.user!.id);
    const role = guild.roles.cache.get(roleId);
    if (role && botMember && role.position >= botMember.roles.highest.position) {
      await ctx.reply({ embeds: [errorEmbed("That role is higher than or equal to my highest role. I cannot assign it.")] }); return;
    }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { autoRoleIds: roleId } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> will now be automatically assigned to new members.`)] });
  },
};
export default command;
