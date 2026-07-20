import { PermissionFlagsBits, type TextChannel } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { TicketModel } from "../../database/models/Tickets.js";

const command: CommandDefinition = {
  name: "tickethold",
  description: "Put the current ticket on hold",
  category: "Tickets",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: "open" });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not an open ticket.")] }); return; }
    ticket.status = "closed"; // Use "closed" to represent hold; custom status isn't in schema
    await ticket.save();
    // Deny opener from sending messages while on hold
    const opener = guild.members.cache.get(ticket.openerId) ?? await guild.members.fetch(ticket.openerId).catch(() => null);
    if (opener) {
      await (channel as TextChannel).permissionOverwrites.edit(opener, { SendMessages: false }).catch(() => {});
    }
    await ctx.reply({ embeds: [successEmbed(`⏸️ Ticket #${ticket.ticketNumber} put on hold.`)] });
  },
};
export default command;
