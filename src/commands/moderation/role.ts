import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "role",
  description: "Manage roles: add, remove, create, delete, change color, or view info",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add").setDescription("Give a role to a member")
          .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to give").setRequired(true))
          .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("remove").setDescription("Remove a role from a member")
          .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true))
          .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("create").setDescription("Create a new role")
          .addStringOption((o) => o.setName("name").setDescription("Role name").setRequired(true))
          .addStringOption((o) => o.setName("color").setDescription("Hex color (e.g. #FF0000)").setRequired(false))
          .addBooleanOption((o) => o.setName("hoist").setDescription("Show separately in member list?").setRequired(false))
          .addBooleanOption((o) => o.setName("mentionable").setDescription("Allow everyone to mention this role?").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("delete").setDescription("Delete a role")
          .addRoleOption((o) => o.setName("role").setDescription("Role to delete").setRequired(true))
          .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("color").setDescription("Change a role's color")
          .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true))
          .addStringOption((o) => o.setName("color").setDescription("New hex color (e.g. #FF5733)").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("info").setDescription("View information about a role")
          .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
    const reason = (ctx.isSlash ? ctx.interaction!.options.getString("reason") : null) ?? "No reason provided";

    if (sub === "add") {
      const userId = ctx.isSlash ? ctx.interaction!.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[2]?.replace(/\D/g, "");
      if (!userId || !roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a user and role.")] }); return; }
      const member = await guild.members.fetch(userId).catch(() => null);
      const role = guild.roles.cache.get(roleId);
      if (!member) { await ctx.reply({ embeds: [errorEmbed("Member not found.")] }); return; }
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }
      if (role.position >= (guild.members.me?.roles.highest.position ?? 0)) {
        await ctx.reply({ embeds: [errorEmbed("That role is at or above my highest role — I cannot assign it.")] });
        return;
      }
      await member.roles.add(role, reason);
      await ctx.reply({ embeds: [successEmbed(`${role} has been given to <@${userId}>.`)] });
      return;
    }

    if (sub === "remove") {
      const userId = ctx.isSlash ? ctx.interaction!.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[2]?.replace(/\D/g, "");
      if (!userId || !roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a user and role.")] }); return; }
      const member = await guild.members.fetch(userId).catch(() => null);
      const role = guild.roles.cache.get(roleId);
      if (!member) { await ctx.reply({ embeds: [errorEmbed("Member not found.")] }); return; }
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }
      if (role.position >= (guild.members.me?.roles.highest.position ?? 0)) {
        await ctx.reply({ embeds: [errorEmbed("That role is at or above my highest role — I cannot remove it.")] });
        return;
      }
      await member.roles.remove(role, reason);
      await ctx.reply({ embeds: [successEmbed(`${role} has been removed from <@${userId}>.`)] });
      return;
    }

    if (sub === "create") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1];
      const colorInput = ctx.isSlash ? (ctx.interaction!.options.getString("color") ?? undefined) : undefined;
      const hoist = ctx.isSlash ? (ctx.interaction!.options.getBoolean("hoist") ?? false) : false;
      const mentionable = ctx.isSlash ? (ctx.interaction!.options.getBoolean("mentionable") ?? false) : false;
      if (!name) { await ctx.reply({ embeds: [errorEmbed("Provide a role name.")] }); return; }

      let color: number | undefined;
      if (colorInput) {
        const hex = colorInput.replace("#", "");
        color = parseInt(hex, 16);
        if (isNaN(color)) { await ctx.reply({ embeds: [errorEmbed("Invalid hex color. Use the format: `#FF0000`.")] }); return; }
      }

      const created = await guild.roles.create({ name, color, hoist, mentionable, reason: `Created by ${ctx.userId}` });
      await ctx.reply({ embeds: [successEmbed(`Role ${created} has been created!`)] });
      return;
    }

    if (sub === "delete") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a role.")] }); return; }
      const role = guild.roles.cache.get(roleId);
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }
      if (role.position >= (guild.members.me?.roles.highest.position ?? 0)) {
        await ctx.reply({ embeds: [errorEmbed("I cannot delete that role — it is at or above my highest role.")] });
        return;
      }
      const name = role.name;
      await role.delete(reason);
      await ctx.reply({ embeds: [successEmbed(`Role **${name}** has been deleted.`)] });
      return;
    }

    if (sub === "color") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      const colorInput = ctx.isSlash ? ctx.interaction!.options.getString("color", true) : ctx.args[2];
      if (!roleId || !colorInput) { await ctx.reply({ embeds: [errorEmbed("Provide a role and hex color.")] }); return; }
      const role = guild.roles.cache.get(roleId);
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }
      const color = parseInt(colorInput.replace("#", ""), 16);
      if (isNaN(color)) { await ctx.reply({ embeds: [errorEmbed("Invalid hex color.")] }); return; }
      await role.setColor(color, reason);
      await ctx.reply({ embeds: [successEmbed(`${role}'s color has been changed to **${colorInput}**.`)] });
      return;
    }

    if (sub === "info") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a role.")] }); return; }
      const role = guild.roles.cache.get(roleId);
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }
      const memberCount = guild.members.cache.filter((m) => m.roles.cache.has(role.id)).size;
      const embed = baseEmbed("primary")
        .setTitle(`🏷️ Role Info: ${role.name}`)
        .setColor(role.color || 0x5865f2)
        .addFields(
          { name: "ID",          value: role.id,                             inline: true },
          { name: "Color",       value: role.hexColor,                       inline: true },
          { name: "Members",     value: String(memberCount),                 inline: true },
          { name: "Hoisted",     value: role.hoist ? "Yes" : "No",          inline: true },
          { name: "Mentionable", value: role.mentionable ? "Yes" : "No",    inline: true },
          { name: "Managed",     value: role.managed ? "Yes (bot/integration)" : "No", inline: true },
          { name: "Position",    value: String(role.position),               inline: true },
          { name: "Created",     value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
        );
      if (role.permissions.bitfield !== BigInt(0)) {
        const perms = role.permissions.toArray().slice(0, 10).join(", ");
        embed.addFields({ name: "Key Permissions", value: perms || "None", inline: false });
      }
      await ctx.reply({ embeds: [embed] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | remove | create | delete | color | info")] });
  },
};

export default command;
