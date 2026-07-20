import { EmbedBuilder } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { TicketModel } from "../../database/models/Tickets.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
const command = {
    name: "ticketclose",
    description: "Close the current ticket",
    category: "Tickets",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["closeticket"],
    slashData: (b) => b.addStringOption((o) => o.setName("reason").setDescription("Reason for closing").setRequired(false).setMaxLength(200)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (!channel)
            return;
        const ticket = await TicketModel.findOne({ channelId: channel.id, status: "open" });
        if (!ticket) {
            await ctx.reply({ embeds: [errorEmbed("This channel is not an open ticket.")] });
            return;
        }
        const reason = (ctx.isSlash ? ctx.interaction.options.getString("reason") : ctx.args.join(" ")) || "No reason provided";
        ticket.status = "closed";
        ticket.closedBy = ctx.userId;
        ticket.closedReason = reason;
        await ticket.save();
        // Deny opener from sending messages
        const opener = guild.members.cache.get(ticket.openerId) ?? await guild.members.fetch(ticket.openerId).catch(() => null);
        if (opener) {
            await channel.permissionOverwrites.edit(opener, { SendMessages: false }).catch(() => { });
        }
        await sendLogEvent(guild.id, "ticket_close", () => new EmbedBuilder()
            .setTitle("🎫 Ticket Closed")
            .addFields({ name: "Ticket", value: `#${ticket.ticketNumber}`, inline: true }, { name: "Closed By", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason })
            .setTimestamp()).catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`🎫 Ticket #${ticket.ticketNumber} closed. Reason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=ticketClose.js.map