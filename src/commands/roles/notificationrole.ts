import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "notificationrole",
  description: "Manage notification roles for specific server events",
  category: "Roles",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  aliases: ["notrole", "notifyrole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add")
          .setDescription("Link a role to receive pings for a specific event type")
          .addRoleOption((o) => o.setName("role").setDescription("Role to ping for the event").setRequired(true))
          .addStringOption((o) =>
            o.setName("event").setDescription("Event type that triggers the ping").setRequired(true)
              .addChoices(
                { name: "Giveaway", value: "giveaway" },
                { name: "Announcements", value: "announcement" },
                { name: "Updates/Changelog", value: "update" },
                { name: "Events", value: "event" },
                { name: "Streams", value: "stream" },
                { name: "Polls", value: "poll" },
                { name: "Maintenance", value: "maintenance" },
              ),
          )
          .addStringOption((o) => o.setName("description").setDescription("Short description of this notification role").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("remove")
          .setDescription("Remove a notification role")
          .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all configured notification roles")),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add") {
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      const event = ctx.isSlash ? ctx.interaction!.options.getString("event", true) : ctx.args[2] ?? "announcement";
      const description = ctx.isSlash ? ctx.interaction!.options.getString("description") ?? event : event;
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      const existing = (doc?.notificationRoles as any[]) ?? [];
      if (existing.some((n: any) => n.roleId === role.id)) {
        await ctx.reply({ embeds: [errorEmbed(`${role} is already a notification role. Remove it first if you want to change it.`)] }); return;
      }

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $push: { notificationRoles: { roleId: role.id, description } } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`${role} has been set as a **${event}** notification role.\n\nMembers can subscribe/unsubscribe by asking a moderator to assign/remove the role, or configure \`/selfrole add\` to allow self-assignment.`)] });

    } else if (sub === "remove") {
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

      const result = await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $pull: { notificationRoles: { roleId: role.id } } },
      );
      if (!result) { await ctx.reply({ embeds: [errorEmbed("That role is not configured as a notification role.")] }); return; }
      await ctx.reply({ embeds: [successEmbed(`${role} removed from notification roles.`)] });

    } else if (sub === "list") {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      const notifRoles = (doc?.notificationRoles as any[]) ?? [];
      if (!notifRoles.length) { await ctx.reply({ embeds: [infoEmbed("No notification roles configured.")] }); return; }
      const embed = baseEmbed("primary")
        .setTitle("🔔 Notification Roles")
        .setDescription(notifRoles.map((n: any) => `<@&${n.roleId}> — ${n.description}`).join("\n"))
        .setFooter({ text: "Members can use /selfrole get to self-assign these roles if enabled" });
      await ctx.reply({ embeds: [embed] });

    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list")] });
    }
  },
};
export default command;
