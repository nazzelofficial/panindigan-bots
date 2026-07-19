import { PermissionFlagsBits } from "discord.js";
import { TicketModel } from "@/database/models/Tickets";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "ticketarchive",
    description: "Archive a ticket — lock and move it to the archive category instead of deleting it",
    category: "Tickets",
    access: "moderator",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    guildOnly: true,
    cooldown: 10,
    aliases: ["archive", "tarchive"],
    slashData: (b) => b
        .addStringOption((o) => o
        .setName("reason")
        .setDescription("Reason for archiving this ticket")
        .setRequired(false)
        .setMaxLength(500)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        const channel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (!guild || !channel)
            return;
        const ticket = await TicketModel.findOne({ guildId: guild.id, channelId: channel.id }).lean();
        if (!ticket) {
            await ctx.reply({ embeds: [errorEmbed("This command must be run inside a ticket channel.")] });
            return;
        }
        if (ticket.status === "archived") {
            await ctx.reply({ embeds: [errorEmbed("This ticket is already archived.")] });
            return;
        }
        const reason = ctx.isSlash
            ? ctx.interaction.options.getString("reason") ?? "No reason provided"
            : ctx.args.join(" ") || "No reason provided";
        // Lock the channel for the ticket creator
        try {
            await channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false, AddReactions: false });
        }
        catch {
            // May already be locked
        }
        // Rename the channel to indicate archived status
        try {
            const currentName = channel.name ?? "ticket";
            if (!currentName.startsWith("archived-")) {
                await channel.setName(`archived-${currentName}`, "Ticket archived");
            }
        }
        catch {
            // Skip if we can't rename
        }
        await TicketModel.findOneAndUpdate({ guildId: guild.id, channelId: channel.id }, { $set: { status: "archived", archivedAt: new Date(), archivedReason: reason, archivedBy: ctx.userId } });
        const embed = baseEmbed("warning")
            .setTitle("📦 Ticket Archived")
            .addFields({ name: "Archived by", value: `<@${ctx.userId}>`, inline: true }, { name: "Reason", value: reason, inline: false })
            .setFooter({ text: "This ticket has been archived and locked." });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=ticketArchive.js.map