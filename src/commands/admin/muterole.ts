import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "muterole",
  description: "Set, create, or sync the mute role for this server",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  aliases: ["setmuterole"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set")
          .setDescription("Set an existing role as the mute role")
          .addRoleOption((o) => o.setName("role").setDescription("Role to use as mute role").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("create").setDescription("Automatically create a mute role with the correct permissions"))
      .addSubcommand((s) => s.setName("sync").setDescription("Sync mute role deny permissions across all text channels"))
      .addSubcommand((s) => s.setName("view").setDescription("View the currently configured mute role")),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";

    if (sub === "set") {
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Role not found.")] }); return; }

      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { muteRoleId: role.id }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`${role} has been set as the mute role. Run \`/muterole sync\` to apply deny permissions to all channels.`)] });

    } else if (sub === "create") {
      const existing = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (existing?.muteRoleId && guild.roles.cache.has(existing.muteRoleId)) {
        await ctx.reply({ embeds: [infoEmbed(`Mute role is already set to <@&${existing.muteRoleId}>. Delete it first or use \`/muterole set\` to change it.`)] }); return;
      }

      const role = await guild.roles.create({ name: "Muted", color: "#808080", reason: `Mute role created by ${ctx.userId}` });
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased()) {
          await (channel as any).permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false, CreatePublicThreads: false }, { reason: "Mute role sync" }).catch(() => {});
        }
      }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { muteRoleId: role.id }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Mute role **${role.name}** created and synced to all channels.`)] });

    } else if (sub === "sync") {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (!doc?.muteRoleId) { await ctx.reply({ embeds: [errorEmbed("No mute role set. Use `/muterole set` or `/muterole create` first.")] }); return; }
      const role = guild.roles.cache.get(doc.muteRoleId);
      if (!role) { await ctx.reply({ embeds: [errorEmbed("Mute role not found. It may have been deleted.")] }); return; }

      let synced = 0, failed = 0;
      for (const [, channel] of guild.channels.cache) {
        if (channel.isTextBased()) {
          try {
            await (channel as any).permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false, CreatePublicThreads: false }, { reason: "Mute role sync" });
            synced++;
          } catch { failed++; }
        }
      }
      await ctx.reply({ embeds: [successEmbed(`Mute role synced to **${synced}** channel${synced !== 1 ? "s" : ""}${failed ? ` (${failed} failed — missing permissions)` : ""}.`)] });

    } else {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (!doc?.muteRoleId) { await ctx.reply({ embeds: [infoEmbed("No mute role configured. Use `/muterole create` or `/muterole set`.")] }); return; }
      await ctx.reply({ embeds: [infoEmbed(`Current mute role: <@&${doc.muteRoleId}>`)] });
    }
  },
};
export default command;
