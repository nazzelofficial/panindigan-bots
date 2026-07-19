import { TradeModel } from "@/database/models/Economy";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "trade_decline",
    description: "Decline the most recent incoming trade request",
    category: "Economy",
    access: "general",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const guildId = guild.id;
        const targetId = ctx.userId;
        const trade = await TradeModel.findOne({
            guildId,
            targetId,
            status: "pending",
        }).sort({ createdAt: -1 });
        if (!trade) {
            return ctx.reply({ embeds: [errorEmbed("❌ You have no pending incoming trade requests.")] });
        }
        trade.status = "declined";
        await trade.save();
        // Notify offerer
        try {
            const offerer = await ctx.client.users.fetch(trade.offererId);
            await offerer.send(`❌ **${(ctx.isSlash ? ctx.interaction?.user?.tag : ctx.message?.author?.tag)}** declined your trade request in **${guild.name}**.`);
        }
        catch { /* DMs disabled */ }
        return ctx.reply({ embeds: [successEmbed(`✅ Trade request from <@${trade.offererId}> has been declined.`)] });
    },
};
export default command;
//# sourceMappingURL=tradeDecline.js.map