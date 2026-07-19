import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "reactionremove",
  description: "Remove a reaction role from a message",
  category: "Reaction Roles",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("message_id").setDescription("Message ID the reaction role is on").setRequired(true))
      .addStringOption((o) => o.setName("emoji").setDescription("Emoji of the reaction role to remove").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const messageId = ctx.isSlash ? ctx.interaction!.options.getString("message_id", true) : ctx.args[0];
    const emoji = ctx.isSlash ? ctx.interaction!.options.getString("emoji", true) : ctx.args[1];
    if (!messageId || !emoji) { await ctx.reply({ embeds: [errorEmbed("Provide message ID and emoji.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { reactionRoles: { messageId, emoji, type: "reaction" } } });
    await ctx.reply({ embeds: [successEmbed(`Reaction role for ${emoji} on message \`${messageId}\` removed.`)] });
  },
};
export default command;
