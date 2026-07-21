import { SlashCommandBuilder, PermissionFlagsBits, type TextChannel } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { TicketModel } from "../../database/models/Tickets.js";

const command: CommandDefinition = {
  name: "ticketremove",
  description: "Remove a user from the current ticket",
  category: "Tickets",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) =>
      o.setName("user").setDescription("User to remove from the ticket").setRequired(true),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: { $ne: "archived" } });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not an active ticket.")] }); return; }
    const userId = ctx.isSlash ? ctx.interaction!.options.getUser("user", true).id : ctx.args[0]?.replace(/[<@!>]/g, "");
    if (!userId) { await ctx.reply({ embeds: [errorEmbed("Please mention a user to remove.")] }); return; }
    if (userId === ticket.openerId) { await ctx.reply({ embeds: [errorEmbed("Cannot remove the ticket opener.")] }); return; }
    await (channel as TextChannel).permissionOverwrites.delete(userId).catch(() => {});
    ticket.participants = ticket.participants.filter((p) => p !== userId);
    await ticket.save();
    await ctx.reply({ embeds: [successEmbed(`✅ Removed <@${userId}> from ticket #${ticket.ticketNumber}.`)] });
  },
};
export default command;
