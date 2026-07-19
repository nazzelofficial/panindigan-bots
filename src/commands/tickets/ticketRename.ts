import { SlashCommandBuilder, PermissionFlagsBits, type TextChannel } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";
import { TicketModel } from "@/database/models/Tickets";

const command: CommandDefinition = {
  name: "ticketrename",
  description: "Rename the current ticket channel",
  category: "Tickets",
  access: "moderator",
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 10,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("name").setDescription("New name for the ticket channel").setRequired(true).setMaxLength(50),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: { $ne: "archived" } });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not an active ticket.")] }); return; }
    const newName = (ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args.join(" ")).replace(/\s+/g, "-").toLowerCase();
    if (!newName) { await ctx.reply({ embeds: [errorEmbed("Please provide a new name.")] }); return; }
    await (channel as TextChannel).setName(`ticket-${newName}`).catch(() => {});
    await ctx.reply({ embeds: [successEmbed(`✅ Ticket channel renamed to **ticket-${newName}**.`)] });
  },
};
export default command;
