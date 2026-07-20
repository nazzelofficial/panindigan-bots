import { PermissionFlagsBits, PermissionsBitField } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const DANGEROUS_PERMS = [
  "Administrator",
  "ManageGuild",
  "ManageRoles",
  "ManageChannels",
  "KickMembers",
  "BanMembers",
  "ManageMessages",
  "ManageWebhooks",
  "ManageNicknames",
  "ModerateMembers",
] as const;

const command: CommandDefinition = {
  name: "bulkroleaudit",
  description: "Audit all roles and highlight risky permission combinations",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 15,
  aliases: ["roleaudit", "auditroles"],
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const roles = [...guild.roles.cache.values()].filter((r) => !r.managed && r.id !== guild.id).sort((a, b) => b.position - a.position);
    if (!roles.length) { await ctx.reply({ embeds: [errorEmbed("No non-managed roles found.")] }); return; }

    const risky: string[] = [];
    const safe: string[] = [];

    for (const role of roles) {
      if (!role.members.size) continue; // skip empty roles

      const riskPerms: string[] = [];
      for (const perm of DANGEROUS_PERMS) {
        if (role.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])) {
          riskPerms.push(perm);
        }
      }

      const memberCount = role.members.size;
      const entry = `${role} (${memberCount} member${memberCount !== 1 ? "s" : ""})`;

      if (role.permissions.has(PermissionFlagsBits.Administrator)) {
        risky.push(`🚨 ${entry}\n↳ **ADMINISTRATOR** — full unrestricted access`);
      } else if (riskPerms.length >= 3) {
        risky.push(`🔴 ${entry}\n↳ High risk: ${riskPerms.slice(0, 5).join(", ")}`);
      } else if (riskPerms.length >= 2) {
        risky.push(`🟠 ${entry}\n↳ Moderate risk: ${riskPerms.join(", ")}`);
      } else if (riskPerms.length === 1) {
        risky.push(`🟡 ${entry}\n↳ Low risk: ${riskPerms[0]}`);
      } else {
        safe.push(`🟢 ${role.name}`);
      }
    }

    const embed = baseEmbed("warning")
      .setTitle("🔍 Role Permission Audit")
      .setFooter({ text: `${roles.length} roles audited · ${risky.length} have elevated permissions` });

    if (risky.length) {
      embed.addFields({ name: `⚠️ Roles with Elevated Permissions (${risky.length})`, value: risky.join("\n\n").slice(0, 1024), inline: false });
    } else {
      embed.addFields({ name: "✅ No High-Risk Roles", value: "All roles with members have safe permissions.", inline: false });
    }

    if (safe.length) {
      embed.addFields({ name: `✅ Safe Roles (${safe.length})`, value: safe.slice(0, 20).join(", ").slice(0, 1024) + (safe.length > 20 ? "..." : ""), inline: false });
    }

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
