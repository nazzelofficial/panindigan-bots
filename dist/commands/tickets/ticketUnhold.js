import { successEmbed, errorEmbed } from "../../utils/embeds";
import { TicketModel } from "../../database/models/Tickets";
const command = {
    name: "ticketunhold",
    description: "Resume a ticket from hold",
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
        ticket.status = "open";
        await ticket.save();
        const opener = guild.members.cache.get(ticket.openerId) ?? await guild.members.fetch(ticket.openerId).catch(() => null);
        if (opener) {
            await channel.permissionOverwrites.edit(opener, { SendMessages: true }).catch(() => { });
        }
        await ctx.reply({ embeds: [successEmbed(`▶️ Ticket #${ticket.ticketNumber} resumed.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketUnhold.js.map