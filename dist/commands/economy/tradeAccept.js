import { EmbedBuilder } from "discord.js";
import { TradeModel } from "../../database/models/Economy.js";
import { UserModel } from "../../database/models/User.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "trade_accept",
    description: "Accept a pending trade request from another user",
    category: "Economy",
    access: "general",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const guildId = guild.id;
        const targetId = ctx.userId;
        // Find the most recent pending trade targeting this user
        const trade = await TradeModel.findOne({
            guildId,
            targetId,
            status: "pending",
        }).sort({ createdAt: -1 });
        if (!trade) {
            return ctx.reply({ embeds: [errorEmbed("❌ You have no pending incoming trade requests. Ask someone to send you one first.")] });
        }
        // Check expiry
        if (new Date() > trade.expiresAt) {
            trade.status = "expired";
            await trade.save();
            return ctx.reply({ embeds: [errorEmbed("❌ That trade request has expired.")] });
        }
        // Validate balances if coins are involved
        const targetUser = await UserModel.findOne({ userId: targetId });
        const targetProfile = targetUser?.guilds.find((g) => g.guildId === guildId);
        if (trade.requestedCoins > 0) {
            const targetBalance = targetProfile?.balance ?? 0;
            if (targetBalance < trade.requestedCoins) {
                return ctx.reply({
                    embeds: [errorEmbed(`❌ You don't have enough coins. This trade requires **${trade.requestedCoins.toLocaleString()}** coins from you.`)],
                });
            }
        }
        if (trade.offeredCoins > 0) {
            const offererUser = await UserModel.findOne({ userId: trade.offererId });
            const offererProfile = offererUser?.guilds.find((g) => g.guildId === guildId);
            const offererBalance = offererProfile?.balance ?? 0;
            if (offererBalance < trade.offeredCoins) {
                trade.status = "expired";
                await trade.save();
                return ctx.reply({ embeds: [errorEmbed("❌ The other party no longer has enough coins to complete this trade. Trade cancelled.")] });
            }
        }
        // Execute coin transfer
        if (trade.offeredCoins > 0) {
            const offererUser = await UserModel.findOne({ userId: trade.offererId });
            const offererProfile = offererUser?.guilds.find((g) => g.guildId === guildId);
            if (offererProfile) {
                offererProfile.balance = (offererProfile.balance ?? 0) - trade.offeredCoins;
                await offererUser?.save();
            }
            if (targetProfile) {
                targetProfile.balance = (targetProfile.balance ?? 0) + trade.offeredCoins;
                await targetUser?.save();
            }
        }
        if (trade.requestedCoins > 0) {
            if (targetProfile) {
                targetProfile.balance = (targetProfile.balance ?? 0) - trade.requestedCoins;
                await targetUser?.save();
            }
            const offererUser = await UserModel.findOne({ userId: trade.offererId });
            const offererProfile = offererUser?.guilds.find((g) => g.guildId === guildId);
            if (offererProfile) {
                offererProfile.balance = (offererProfile.balance ?? 0) + trade.requestedCoins;
                await offererUser?.save();
            }
        }
        trade.status = "accepted";
        await trade.save();
        // Notify offerer
        try {
            const offerer = await ctx.client.users.fetch(trade.offererId);
            await offerer.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🤝 Trade Accepted!")
                        .setColor("#00C851")
                        .setDescription(`**${(ctx.isSlash ? ctx.interaction?.user?.tag : ctx.message?.author?.tag)}** accepted your trade in **${guild.name}**.`)
                        .addFields({ name: "You Gave", value: trade.offeredCoins > 0 ? `${trade.offeredCoins.toLocaleString()} coins` : "Nothing", inline: true }, { name: "You Received", value: trade.requestedCoins > 0 ? `${trade.requestedCoins.toLocaleString()} coins` : "Nothing", inline: true }),
                ],
            });
        }
        catch { /* DMs disabled */ }
        const embed = baseEmbed("success")
            .setTitle("✅ Trade Accepted")
            .addFields({ name: "Trading With", value: `<@${trade.offererId}>`, inline: true }, { name: "You Received", value: trade.offeredCoins > 0 ? `${trade.offeredCoins.toLocaleString()} coins` : "Nothing", inline: true }, { name: "You Gave", value: trade.requestedCoins > 0 ? `${trade.requestedCoins.toLocaleString()} coins` : "Nothing", inline: true });
        return ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=tradeAccept.js.map