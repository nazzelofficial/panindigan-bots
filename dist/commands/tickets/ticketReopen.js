import { EmbedBuilder } from "discord.js";
import { successEmbed, errorEmbed } from "@/utils/embeds";
import { TicketModel } from "@/database/models/Tickets";
import { sendLogEvent } from "@/features/logging/logEngine";
const command = {
    name: "ticketreopen",
    description: "Reopen a closed ticket",
    category: "Tickets",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (!channel)
            return;
        const ticket = await TicketModel.findOne({ channelId: channel.id });
        if (!ticket) {
            await ctx.reply({ embeds: [errorEmbed("This channel is not a ticket.")] });
            return;
        }
        if (ticket.status === "open") {
            await ctx.reply({ embeds: [errorEmbed("This ticket is already open.")] });
            return;
        }
        if (ticket.status === "archived") {
            await ctx.reply({ embeds: [errorEmbed("Archived tickets cannot be reopened.")] });
            return;
        }
        ticket.status = "open";
        ticket.closedBy = null;
        ticket.closedReason = null;
        await ticket.save();
        // Restore opener's access
        const opener = guild.members.cache.get(ticket.openerId) ?? await guild.members.fetch(ticket.openerId).catch(() => null);
        if (opener) {
            await channel.permissionOverwrites.edit(opener, {
                ViewChannel: true, SendMessages: true,
            }).catch(() => { });
        }
        await sendLogEvent(guild.id, "ticket_reopen", () => new EmbedBuilder()
            .setTitle("🔓 Ticket Reopened")
            .addFields({ name: "Ticket", value: `#${ticket.ticketNumber}`, inline: true }, { name: "By", value: `<@${ctx.userId}>`, inline: true })
            .setTimestamp()).catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`🔓 Ticket #${ticket.ticketNumber} reopened.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketReopen.js.map