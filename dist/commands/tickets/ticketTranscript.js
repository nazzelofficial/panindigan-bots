import { AttachmentBuilder, PermissionFlagsBits } from "discord.js";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
import { TicketModel } from "@/database/models/Tickets";
async function buildTranscript(channel) {
    const messages = [];
    let before;
    while (true) {
        const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
        if (batch.size === 0)
            break;
        messages.push(...batch.values());
        before = batch.last()?.id;
        if (batch.size < 100)
            break;
    }
    messages.reverse();
    const lines = messages.map((m) => {
        const ts = new Date(m.createdTimestamp).toISOString();
        const content = m.content || (m.embeds.length ? "[embed]" : "[attachment]");
        return `[${ts}] ${m.author.tag}: ${content}`;
    });
    return lines.join("\n");
}
const command = {
    name: "tickettranscript",
    description: "Generate a transcript of the current ticket",
    category: "Tickets",
    access: "moderator",
    guildOnly: true,
    botPermissions: [PermissionFlagsBits.ReadMessageHistory],
    cooldown: 10,
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
        if (ctx.isSlash)
            await ctx.interaction.deferReply({ ephemeral: true });
        try {
            const text = await buildTranscript(channel);
            const buffer = Buffer.from(text, "utf-8");
            const attachment = new AttachmentBuilder(buffer, { name: `ticket-${ticket.ticketNumber}-transcript.txt` });
            const embed = baseEmbed("primary")
                .setTitle(`📄 Ticket #${ticket.ticketNumber} Transcript`)
                .setDescription(`Transcript generated for **#${channel.name}**\n${text.split("\n").length} messages`)
                .setTimestamp();
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [embed], files: [attachment] });
            else
                await ctx.reply({ embeds: [embed], files: [attachment] });
        }
        catch (err) {
            const e = errorEmbed(`Failed to generate transcript: ${err.message}`);
            if (ctx.isSlash)
                await ctx.interaction.editReply({ embeds: [e] }).catch(() => { });
            else
                await ctx.reply({ embeds: [e] });
        }
    },
};
export default command;
//# sourceMappingURL=ticketTranscript.js.map