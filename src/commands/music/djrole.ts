import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "djrole",
  description: "Set, add, remove, or view DJ roles that can control music when DJ Mode is on",
  category: "Music",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add").setDescription("Add a DJ role")
          .addRoleOption((o) => o.setName("role").setDescription("Role to grant DJ access").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove").setDescription("Remove a DJ role")
          .addRoleOption((o) => o.setName("role").setDescription("DJ role to remove").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all DJ roles")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "list");
    if (sub === "add") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { djRoleIds: roleId } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> added as a DJ role.`)] });
    } else if (sub === "remove") {
      const roleId = ctx.isSlash ? ctx.interaction!.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
      if (!roleId) { await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { djRoleIds: roleId } });
      await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> removed from DJ roles.`)] });
    } else {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const ids: string[] = (cfg as any)?.djRoleIds ?? [];
      const embed = baseEmbed("primary").setTitle("🎧 DJ Roles").setDescription(ids.length ? ids.map((id) => `• <@&${id}>`).join("\n") : "No DJ roles configured.").setFooter({ text: `DJ Mode: ${(cfg as any)?.music?.djMode ? "Enabled" : "Disabled"}` });
      await ctx.reply({ embeds: [embed] });
    }
  },
};
export default command;
