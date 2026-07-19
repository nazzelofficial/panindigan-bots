import { EmbedBuilder } from "discord.js";
import { AuctionModel } from "@/database/models/Economy";
import { UserModel } from "@/database/models/User";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "auction_end",
    description: "End the current auction and pay out the winner",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const guildId = guild.id;
        const auction = await AuctionModel.findOne({ guildId, ended: false });
        if (!auction) {
            return ctx.reply({ embeds: [errorEmbed("❌ There is no active auction in this server.")] });
        }
        auction.ended = true;
        await auction.save();
        let resultEmbed;
        if (!auction.highestBidderId) {
            resultEmbed = baseEmbed("danger")
                .setTitle("🎪 Auction Ended — No Bids")
                .setDescription(`The auction for **${auction.item}** ended with **no bids**. The item has been returned to the host.`);
        }
        else {
            // Deduct coins from winner
            const winnerUser = await UserModel.findOne({ userId: auction.highestBidderId });
            if (winnerUser) {
                const winnerProfile = winnerUser.guilds.find((g) => g.guildId === guildId);
                if (winnerProfile) {
                    winnerProfile.balance = (winnerProfile.balance ?? 0) - auction.currentBid;
                    await winnerUser.save();
                }
            }
            resultEmbed = baseEmbed("success")
                .setTitle("🎪 Auction Ended!")
                .addFields({ name: "📦 Item", value: auction.item, inline: true }, { name: "🏆 Winner", value: `<@${auction.highestBidderId}>`, inline: true }, { name: "💰 Winning Bid", value: `🪙 ${auction.currentBid.toLocaleString()}`, inline: true })
                .setDescription(`Congratulations to <@${auction.highestBidderId}> for winning the auction!`)
                .setFooter({ text: `Hosted by <@${auction.hostId}>` });
            // Notify the winner
            try {
                const winner = await ctx.client.users.fetch(auction.highestBidderId);
                await winner.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🏆 You Won an Auction!")
                            .setColor("#FFD700")
                            .setDescription(`You won the auction for **${auction.item}** in **${guild.name}** for **${auction.currentBid.toLocaleString()} coins**!`),
                    ],
                });
            }
            catch { /* DMs disabled */ }
        }
        // Update the auction message in the channel
        try {
            const channel = guild.channels.cache.get(auction.channelId);
            if (channel && auction.messageId) {
                const msg = await channel.messages.fetch(auction.messageId);
                await msg.edit({ embeds: [resultEmbed] });
            }
        }
        catch { /* message may be deleted */ }
        await ctx.reply({ embeds: [resultEmbed] });
    },
};
export default command;
//# sourceMappingURL=auctionEnd.js.map