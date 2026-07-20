import { EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { TicketModel } from "../../database/models/Tickets.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";

const command: CommandDefinition = {
  name: "ticketunclaim",
  description: "Unclaim the current ticket",
  category: "Tickets",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id, status: { $ne: "archived" } });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not an active ticket.")] }); return; }
    if (!ticket.claimedBy) { await ctx.reply({ embeds: [errorEmbed("This ticket is not claimed.")] }); return; }
    const prev = ticket.claimedBy;
    ticket.claimedBy = null;
    await ticket.save();
    await sendLogEvent(guild.id, "ticket_unclaim", () =>
      new EmbedBuilder()
        .setTitle("🎫 Ticket Unclaimed")
        .addFields({ name: "Ticket", value: `#${ticket.ticketNumber}`, inline: true }, { name: "By", value: `<@${ctx.userId}>`, inline: true })
        .setTimestamp(),
    ).catch(() => {});
    await ctx.reply({ embeds: [successEmbed(`🎫 Ticket #${ticket.ticketNumber} unclaimed (was held by <@${prev}>).`)] });
  },
};
export default command;
