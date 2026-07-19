import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "adminrole",
  description: "Add, remove, or list roles that grant admin-level access to the bot",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 5,
  aliases: ["adminroles", "setadminrole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add")
          .setDescription("Grant a role admin-level bot access")
          .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove")
          .setDescription("Remove a role from admin access")
          .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all roles with admin bot access")),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add") {
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      if ((doc?.adminRoleIds ?? []).includes(role.id)) {
        await ctx.reply({ embeds: [infoEmbed(`${role} already has admin bot access.`)] }); return;
      }

      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { adminRoleIds: role.id } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`${role} now has **admin-level** bot access. Members with this role can run admin commands.`)] });

    } else if (sub === "remove") {
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { adminRoleIds: role.id } });
      await ctx.reply({ embeds: [successEmbed(`${role} no longer has admin bot access.`)] });

    } else if (sub === "list") {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      const adminRoles = doc?.adminRoleIds ?? [];
      if (!adminRoles.length) { await ctx.reply({ embeds: [infoEmbed("No admin roles configured. Members need the **Administrator** Discord permission by default.")] }); return; }
      const embed = baseEmbed("primary")
        .setTitle("🔐 Admin Roles")
        .setDescription(adminRoles.map((id: string) => `<@&${id}>`).join("\n"))
        .setFooter({ text: "Members with these roles can use admin bot commands" });
      await ctx.reply({ embeds: [embed] });

    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list")] });
    }
  },
};
export default command;
