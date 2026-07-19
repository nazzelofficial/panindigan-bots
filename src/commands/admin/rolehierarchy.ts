import { PermissionFlagsBits } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "rolehierarchy",
  description: "View the complete role hierarchy of this server in a readable format",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 10,
  aliases: ["roletree", "rolelist2", "hierarchy"],
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const roles = [...guild.roles.cache.values()]
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position);

    if (!roles.length) { await ctx.reply({ embeds: [errorEmbed("No roles found.")] }); return; }

    const lines: string[] = [];
    for (const role of roles) {
      const memberCount = role.members.size;
      const isAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
      const isMod = role.permissions.has(PermissionFlagsBits.KickMembers) || role.permissions.has(PermissionFlagsBits.BanMembers);
      const isManaged = role.managed;

      let flags = "";
      if (isAdmin) flags += " 🔴";
      if (!isAdmin && isMod) flags += " 🟡";
      if (isManaged) flags += " 🤖";

      const color = role.hexColor !== "#000000" ? ` \`${role.hexColor}\`` : "";
      lines.push(`${String(role.position).padStart(3, " ")}. ${role.name}${flags}${color} · ${memberCount}m`);
    }

    // Split into pages of 30
    const pageSize = 30;
    const pages = Math.ceil(lines.length / pageSize);
    const page1Lines = lines.slice(0, pageSize);

    const legend = "🔴 Admin · 🟡 Moderator perms · 🤖 Bot/Integration role · m = members";
    const embed = baseEmbed("primary")
      .setTitle(`📊 Role Hierarchy — ${guild.name}`)
      .setDescription(`\`\`\`\n${page1Lines.join("\n")}\`\`\``)
      .setFooter({ text: `${roles.length} roles total${pages > 1 ? ` · Page 1/${pages} (showing top ${pageSize})` : ""} · ${legend}` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
