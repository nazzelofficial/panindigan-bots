import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "roleinfo",
  description: "View impormasyon ng isang role",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["ri", "rinfo"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addRoleOption((o) =>
      o.setName("role").setDescription("Role na titingnan").setRequired(true),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const roleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("role", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Provide a role.")] }); return; }

    const role = guild.roles.cache.get(roleId);
    if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

    const memberCount = guild.members.cache.filter((m) => m.roles.cache.has(role.id)).size;

    const keyPerms = role.permissions.toArray()
      .filter((p) => ["Administrator", "ManageGuild", "ManageChannels", "ManageRoles", "KickMembers", "BanMembers", "ManageMessages", "MentionEveryone"].includes(p))
      .map((p) => `\`${p}\``);

    const embed = baseEmbed("primary")
      .setTitle(`🏷️ Role Info`)
      .setColor(role.color || 0x5865f2)
      .addFields(
        { name: "Name", value: role.name, inline: true },
        { name: "ID", value: role.id, inline: true },
        { name: "Color", value: role.color ? role.hexColor.toUpperCase() : "Default", inline: true },
        { name: "Members", value: `${memberCount.toLocaleString()}`, inline: true },
        { name: "Position", value: `${role.position} (of ${guild.roles.cache.size})`, inline: true },
        { name: "Mentionable", value: role.mentionable ? "✅ Yes" : "❌ No", inline: true },
        { name: "Hoisted", value: role.hoist ? "✅ Yes (shown in sidebar)" : "❌ No", inline: true },
        { name: "Managed", value: role.managed ? "✅ Yes (bot/integration)" : "❌ No", inline: true },
        { name: "Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D> (<t:${Math.floor(role.createdTimestamp / 1000)}:R>)`, inline: false },
      );

    if (keyPerms.length) embed.addFields({ name: "⚠️ Key Permissions", value: keyPerms.join(", "), inline: false });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
