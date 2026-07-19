import { successEmbed, errorEmbed } from "../../utils/embeds";
import { TicketModel } from "../../database/models/Tickets";
const command = {
    name: "ticketadd",
    description: "Add a user to the current ticket",
    category: "Tickets",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to add to the ticket").setRequired(true)),
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
        const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/[<@!>]/g, "");
        if (!userId) {
            await ctx.reply({ embeds: [errorEmbed("Please mention a user to add.")] });
            return;
        }
        const member = guild.members.cache.get(userId) ?? await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Could not find that user in this server.")] });
            return;
        }
        await channel.permissionOverwrites.edit(member, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
        });
        if (!ticket.participants.includes(userId)) {
            ticket.participants.push(userId);
            await ticket.save();
        }
        await ctx.reply({ embeds: [successEmbed(`✅ Added <@${userId}> to ticket #${ticket.ticketNumber}.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketAdd.js.map