import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { ReactionRoleModel } from "@/database/models/Community";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "reactionrole",
  description: "Set up reaction roles on a message",
  category: "Roles",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.AddReactions],
  guildOnly: true,
  cooldown: 5,
  aliases: ["rr"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add a reaction role to a message")
          .addStringOption((o) => o.setName("messageid").setDescription("Message ID").setRequired(true))
          .addStringOption((o) => o.setName("emoji").setDescription("Emoji to react with").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true))
          .addChannelOption((o) => o.setName("channel").setDescription("Channel (default: current)").setRequired(false)),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a reaction role")
          .addStringOption((o) => o.setName("messageid").setDescription("Message ID").setRequired(true))
          .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("List all reaction roles in this server"))
      .addSubcommand((s) =>
        s
          .setName("clear")
          .setDescription("Remove all reaction roles from a message")
          .addStringOption((o) => o.setName("messageid").setDescription("Message ID").setRequired(true)),
      ),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add") {
      const messageId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      const emoji = ctx.isSlash ? ctx.interaction!.options.getString("emoji", true) : ctx.args[2];
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role", true) : guild.roles.cache.get(ctx.args[3]?.replace(/\D/g, "") ?? "");
      const channel = ctx.isSlash
        ? (ctx.interaction!.options.getChannel("channel") ?? ctx.interaction!.channel) as any
        : ctx.message?.channel;

      if (!messageId || !emoji || !role || !channel?.isTextBased()) {
        await ctx.reply({ embeds: [errorEmbed("Provide message ID, emoji, role, and ensure it's a text channel.")] }); return;
      }

      const msg = await (channel as any).messages.fetch(messageId).catch(() => null);
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Message not found in that channel.")] }); return; }

      const botMember = guild.members.me;
      if (botMember && guild.roles.cache.get(role.id)!.position >= botMember.roles.highest.position) {
        await ctx.reply({ embeds: [errorEmbed("I can't assign a role higher than or equal to my highest role.")] });
        return;
      }

      await msg.react(emoji).catch(() => {});
      await ReactionRoleModel.findOneAndUpdate(
        { guildId: guild.id, messageId, emoji },
        { guildId: guild.id, channelId: channel.id, messageId, emoji, roleId: role.id },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`Reaction role added: React with ${emoji} in ${channel} to get ${role}.`)] });
    } else if (sub === "remove") {
      const messageId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      const emoji = ctx.isSlash ? ctx.interaction!.options.getString("emoji", true) : ctx.args[2];
      const deleted = await ReactionRoleModel.findOneAndDelete({ guildId: guild.id, messageId, emoji });
      if (!deleted) { await ctx.reply({ embeds: [errorEmbed("Reaction role not found.")] }); return; }
      await ctx.reply({ embeds: [successEmbed(`Reaction role for ${emoji} on message \`${messageId}\` removed.`)] });
    } else if (sub === "list") {
      const rrs = await ReactionRoleModel.find({ guildId: guild.id }).lean();
      if (!rrs.length) { await ctx.reply({ embeds: [infoEmbed("No reaction roles configured.")] }); return; }
      const embed = baseEmbed("primary").setTitle("🎭 Reaction Roles").setDescription(
        rrs.map((r) => `${r.emoji} → <@&${r.roleId}> (msg: \`${r.messageId}\` in <#${r.channelId}>)`).join("\n").slice(0, 4000),
      );
      await ctx.reply({ embeds: [embed] });
    } else if (sub === "clear") {
      const messageId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      const result = await ReactionRoleModel.deleteMany({ guildId: guild.id, messageId });
      await ctx.reply({ embeds: [successEmbed(`Removed **${result.deletedCount}** reaction role(s) from message \`${messageId}\`.`)] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list | clear")] });
    }
  },
};
export default command;
