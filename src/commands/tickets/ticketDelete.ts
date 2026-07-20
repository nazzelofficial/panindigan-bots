import { PermissionFlagsBits, type TextChannel, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed, warnEmbed } from "../../utils/embeds.js";
import { TicketModel } from "../../database/models/Tickets.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";

const command: CommandDefinition = {
  name: "ticketdelete",
  description: "Permanently delete a ticket channel",
  category: "Tickets",
  access: "admin",
  guildOnly: true,
  botPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 5,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel) return;
    const ticket = await TicketModel.findOne({ channelId: channel.id });
    if (!ticket) { await ctx.reply({ embeds: [errorEmbed("This channel is not a ticket.")] }); return; }
    await ctx.reply({ embeds: [warnEmbed(`⚠️ Deleting ticket #${ticket.ticketNumber} in 3 seconds...`)] });
    await sendLogEvent(guild.id, "ticket_delete", () =>
      new EmbedBuilder()
        .setTitle("🗑️ Ticket Deleted")
        .addFields({ name: "Ticket", value: `#${ticket.ticketNumber}`, inline: true }, { name: "By", value: `<@${ctx.userId}>`, inline: true })
        .setTimestamp(),
    ).catch(() => {});
    await TicketModel.deleteOne({ _id: ticket._id });
    setTimeout(() => { (channel as TextChannel).delete().catch(() => {}); }, 3000);
  },
};
export default command;
