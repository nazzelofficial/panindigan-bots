import { EmbedBuilder } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds";
import { TicketModel } from "../../database/models/Tickets";
import { sendLogEvent } from "../../features/logging/logEngine";
const command = {
    name: "ticketclaim",
    description: "Claim the current ticket (assigns it to you)",
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
        const ticket = await TicketModel.findOne({ channelId: channel.id, status: { $ne: "archived" } });
        if (!ticket) {
            await ctx.reply({ embeds: [errorEmbed("This channel is not an active ticket.")] });
            return;
        }
        if (ticket.claimedBy) {
            await ctx.reply({ embeds: [errorEmbed(`This ticket is already claimed by <@${ticket.claimedBy}>.`)] });
            return;
        }
        ticket.claimedBy = ctx.userId;
        await ticket.save();
        await sendLogEvent(guild.id, "ticket_claim", () => new EmbedBuilder()
            .setTitle("🎫 Ticket Claimed")
            .addFields({ name: "Ticket", value: `#${ticket.ticketNumber}`, inline: true }, { name: "By", value: `<@${ctx.userId}>`, inline: true })
            .setTimestamp()).catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`🎫 Ticket #${ticket.ticketNumber} claimed by <@${ctx.userId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketClaim.js.map