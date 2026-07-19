import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "commandperms",
  description: "Restrict commands to specific roles — control who can use each command",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 5,
  aliases: ["cmdperms", "cmdperm"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set").setDescription("Set which roles are allowed to use a command")
          .addStringOption((o) => o.setName("command").setDescription("Command name").setRequired(true))
          .addRoleOption((o) => o.setName("role1").setDescription("Required role").setRequired(true))
          .addRoleOption((o) => o.setName("role2").setDescription("Additional role (optional)").setRequired(false))
          .addRoleOption((o) => o.setName("role3").setDescription("Additional role (optional)").setRequired(false)),
      )
      .addSubcommand((s) =>
        s.setName("clear").setDescription("Remove custom role restrictions from a command (revert to default access)")
          .addStringOption((o) => o.setName("command").setDescription("Command name").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("View all configured command permissions")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "set") {
      const cmdName = (ctx.isSlash ? ctx.interaction!.options.getString("command", true) : ctx.args[1])?.toLowerCase();
      if (!cmdName) { await ctx.reply({ embeds: [errorEmbed("Provide a command name.")] }); return; }
      if (!ctx.client.commands.has(cmdName)) { await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` not found.`)] }); return; }

      const roleIds: string[] = [];
      if (ctx.isSlash) {
        for (const key of ["role1", "role2", "role3"]) {
          const r = ctx.interaction!.options.getRole(key);
          if (r) roleIds.push(r.id);
        }
      } else {
        ctx.args.slice(2).forEach((a) => { const id = a.replace(/\D/g, ""); if (id) roleIds.push(id); });
      }

      if (!roleIds.length) { await ctx.reply({ embeds: [errorEmbed("Provide at least one role.")] }); return; }

      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { commandPermissions: { command: cmdName } } }, { upsert: true });
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { commandPermissions: { command: cmdName, roleIds } } });

      await ctx.reply({
        embeds: [successEmbed(`Permissions for \`${cmdName}\` set to: ${roleIds.map((id) => `<@&${id}>`).join(", ")}`)],
      });
      return;
    }

    if (sub === "clear") {
      const cmdName = (ctx.isSlash ? ctx.interaction!.options.getString("command", true) : ctx.args[1])?.toLowerCase();
      if (!cmdName) { await ctx.reply({ embeds: [errorEmbed("Provide a command name.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { commandPermissions: { command: cmdName } } });
      await ctx.reply({ embeds: [successEmbed(`Custom permissions for \`${cmdName}\` have been cleared — reverted to default access level.`)] });
      return;
    }

    if (sub === "list") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const perms: any[] = (cfg as any)?.commandPermissions ?? [];
      if (!perms.length) {
        await ctx.reply({ embeds: [baseEmbed("primary").setTitle("⚙️ Command Permissions").setDescription("No custom command permissions configured.")] });
        return;
      }
      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("⚙️ Command Permissions")
            .setDescription(
              perms.map((p) => `**\`${p.command}\`** → ${p.roleIds.map((id: string) => `<@&${id}>`).join(", ")}`).join("\n"),
            ),
        ],
      });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: set | clear | list")] });
  },
};

export default command;
