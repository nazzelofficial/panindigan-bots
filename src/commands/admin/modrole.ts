import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "modrole",
  description: "Manage staff roles: add or remove Mod, Admin, and DJ roles for bot access control",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 5,
  aliases: ["staffrole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add").setDescription("Add a staff role")
          .addStringOption((o) =>
            o.setName("type").setDescription("Role type").setRequired(true)
              .addChoices({ name: "Mod", value: "mod" }, { name: "Admin", value: "admin" }, { name: "DJ", value: "dj" }),
          )
          .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove").setDescription("Remove a staff role")
          .addStringOption((o) =>
            o.setName("type").setDescription("Role type").setRequired(true)
              .addChoices({ name: "Mod", value: "mod" }, { name: "Admin", value: "admin" }, { name: "DJ", value: "dj" }),
          )
          .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("setmute").setDescription("Set the server mute role")
          .addRoleOption((o) => o.setName("role").setDescription("Mute role").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("View all configured staff roles")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add" || sub === "remove") {
      const type = ctx.isSlash ? ctx.interaction!.options.getString("type", true) : ctx.args[1];
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[2]?.replace(/\D/g, "");
      if (!type || !roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a role type and role.")] }); return; }

      const fieldMap: Record<string, string> = { mod: "modRoleIds", admin: "adminRoleIds", dj: "djRoleIds" };
      const field = fieldMap[type];
      if (!field) { await ctx.reply({ embeds: [errorEmbed("Invalid type. Valid options: mod | admin | dj")] }); return; }

      const op = sub === "add" ? "$addToSet" : "$pull";
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { [op]: { [field]: roleId } }, { upsert: true });
      const role = guild.roles.cache.get(roleId);
      await ctx.reply({ embeds: [successEmbed(`${sub === "add" ? "Added" : "Removed"} ${role ?? `<@&${roleId}>`} as a **${type.toUpperCase()}** role.`)] });
      return;
    }

    if (sub === "setmute") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a mute role.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { muteRoleId: roleId } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Mute role set to <@&${roleId}>.`)] });
      return;
    }

    if (sub === "list") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const doc = cfg as any;
      const fmtRoles = (ids: string[]) => ids?.length ? ids.map((id) => `<@&${id}>`).join(", ") : "None";
      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("👥 Server Staff Roles")
            .addFields(
              { name: "🛡️ Admin Roles", value: fmtRoles(doc?.adminRoleIds ?? []), inline: false },
              { name: "🔨 Mod Roles",   value: fmtRoles(doc?.modRoleIds ?? []),   inline: false },
              { name: "🎵 DJ Roles",    value: fmtRoles(doc?.djRoleIds ?? []),    inline: false },
              { name: "🔇 Mute Role",   value: doc?.muteRoleId ? `<@&${doc.muteRoleId}>` : "None", inline: false },
            ),
        ],
      });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | remove | setmute | list")] });
  },
};

export default command;
