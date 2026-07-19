import { GiveawayModel } from "@/database/models/Community";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "giveawayinfo",
    description: "Show detailed information about a specific giveaway",
    category: "Giveaways",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["ginfo"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a giveaway message ID.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No giveaway found with that message ID.")] });
            return;
        }
        const g = giveaway;
        const embed = baseEmbed("primary")
            .setTitle(`🎉 Giveaway — ${g.prize}`)
            .addFields({ name: "Status", value: g.ended ? "✅ Ended" : g.paused ? "⏸️ Paused" : "🟢 Active", inline: true }, { name: "Winners", value: g.winnerCount.toString(), inline: true }, { name: "Entries", value: (g.participants?.length ?? 0).toString(), inline: true }, { name: "Channel", value: `<#${g.channelId}>`, inline: true }, { name: "Host", value: `<@${g.hostId}>`, inline: true }, { name: "Ends At", value: `<t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R>`, inline: true }, ...(g.ended && g.winners?.length ? [{ name: "Winners", value: g.winners.map((id) => `<@${id}>`).join(", "), inline: false }] : []));
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=giveawayInfo.js.map