import { UserModel } from "../../database/models/User.js";
import { errorEmbed, baseEmbed } from "../../utils/embeds.js";
const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣", "⭐"];
const SLOT_MULTIPLIERS = { "💎": 10, "7️⃣": 7, "⭐": 5, "🍇": 3, "🍊": 2, "🍋": 1.5, "🍒": 1.2 };
function spin() {
    return Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
}
function slotsMultiplier(reels) {
    if (reels[0] === reels[1] && reels[1] === reels[2])
        return (SLOT_MULTIPLIERS[reels[0]] ?? 1) * 3;
    if (reels[0] === reels[1] || reels[1] === reels[2])
        return 0.5;
    return 0;
}
const command = {
    name: "gamble",
    description: "Gamble your coins — slots, coinflip, or roulette",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["bet", "casino"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("slots")
        .setDescription("Spin the slot machine")
        .addStringOption((o) => o.setName("bet").setDescription("Bet amount or 'all'").setRequired(true)))
        .addSubcommand((s) => s.setName("coinflip")
        .setDescription("Double or nothing on heads/tails")
        .addStringOption((o) => o.setName("bet").setDescription("Bet amount or 'all'").setRequired(true))
        .addStringOption((o) => o.setName("side").setDescription("heads or tails").setRequired(true)
        .addChoices({ name: "heads", value: "heads" }, { name: "tails", value: "tails" })))
        .addSubcommand((s) => s.setName("roulette")
        .setDescription("Bet on red, black, green, or a number (0-36)")
        .addStringOption((o) => o.setName("bet").setDescription("Bet amount or 'all'").setRequired(true))
        .addStringOption((o) => o.setName("choice").setDescription("red, black, green, or 0-36").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "slots";
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        const wallet = profile.balance ?? 0;
        const rawBet = ctx.isSlash ? ctx.interaction.options.getString("bet", true) : ctx.args[1] ?? "0";
        const betAmt = rawBet?.toLowerCase() === "all" ? wallet : parseInt(rawBet ?? "0");
        if (!betAmt || betAmt < 1) {
            await ctx.reply({ embeds: [errorEmbed("Invalid bet amount.")] });
            return;
        }
        if (betAmt > wallet) {
            await ctx.reply({ embeds: [errorEmbed(`Insufficient funds. Wallet: 🪙 **${wallet.toLocaleString()}**.`)] });
            return;
        }
        if (sub === "slots") {
            const reels = spin();
            const mult = slotsMultiplier(reels);
            const winnings = mult > 0 ? Math.floor(betAmt * mult) : 0;
            const net = winnings - betAmt;
            profile.balance = wallet + net;
            profile.totalGambled = (profile.totalGambled ?? 0) + betAmt;
            if (net > 0)
                profile.totalGambledWon = (profile.totalGambledWon ?? 0) + net;
            if (net > 0)
                profile.gamesWon = (profile.gamesWon ?? 0) + 1;
            else if (net < 0)
                profile.gamesLost = (profile.gamesLost ?? 0) + 1;
            else
                profile.gamesTied = (profile.gamesTied ?? 0) + 1;
            await user.save();
            const embed = baseEmbed(net > 0 ? "success" : net < 0 ? "danger" : "info")
                .setTitle("🎰 Slot Machine")
                .setDescription(`**[ ${reels.join(" | ")} ]**\n\n${net > 0 ? `🎉 You won **${winnings.toLocaleString()} 🪙**! (×${mult})` : net < 0 ? `😔 You lost **${betAmt.toLocaleString()} 🪙**.` : `😐 You pushed! (×0.5)`}`)
                .setFooter({ text: `Balance: ${(profile.balance).toLocaleString()} 🪙` });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "coinflip") {
            const side = ctx.isSlash ? ctx.interaction.options.getString("side", true) : ctx.args[2]?.toLowerCase() ?? "heads";
            const flip = Math.random() < 0.5 ? "heads" : "tails";
            const won = flip === side;
            const net = won ? betAmt : -betAmt;
            profile.balance = wallet + net;
            profile.totalGambled = (profile.totalGambled ?? 0) + betAmt;
            if (won) {
                profile.totalGambledWon = (profile.totalGambledWon ?? 0) + betAmt;
                profile.gamesWon = (profile.gamesWon ?? 0) + 1;
            }
            else
                profile.gamesLost = (profile.gamesLost ?? 0) + 1;
            await user.save();
            await ctx.reply({ embeds: [baseEmbed(won ? "success" : "danger").setTitle(`🪙 Coinflip — ${flip.toUpperCase()}`).setDescription(won ? `✅ You guessed **${side}** correctly! +**${betAmt.toLocaleString()} 🪙**` : `❌ It was **${flip}**. You lost **${betAmt.toLocaleString()} 🪙**.`).setFooter({ text: `Balance: ${(profile.balance).toLocaleString()} 🪙` })] });
        }
        else {
            // Roulette
            const choice = ctx.isSlash ? ctx.interaction.options.getString("choice", true) : ctx.args[2]?.toLowerCase() ?? "red";
            const roll = Math.floor(Math.random() * 37); // 0-36
            const isGreen = roll === 0;
            const isRed = !isGreen && roll % 2 === 1;
            const isBlack = !isGreen && !isRed;
            const color = isGreen ? "🟢 green" : isRed ? "🔴 red" : "⚫ black";
            let mult = 0;
            const choiceNum = parseInt(choice);
            if (!isNaN(choiceNum) && choiceNum === roll)
                mult = 35;
            else if (choice === "green" && isGreen)
                mult = 14;
            else if (choice === "red" && isRed)
                mult = 2;
            else if (choice === "black" && isBlack)
                mult = 2;
            const winnings = mult > 0 ? Math.floor(betAmt * mult) : 0;
            const net = winnings - betAmt;
            profile.balance = wallet + net;
            profile.totalGambled = (profile.totalGambled ?? 0) + betAmt;
            if (net > 0) {
                profile.totalGambledWon = (profile.totalGambledWon ?? 0) + net;
                profile.gamesWon = (profile.gamesWon ?? 0) + 1;
            }
            else
                profile.gamesLost = (profile.gamesLost ?? 0) + 1;
            await user.save();
            await ctx.reply({ embeds: [baseEmbed(net > 0 ? "success" : "danger").setTitle("🎡 Roulette").setDescription(`The ball landed on **${roll}** (${color})!\n\n${net > 0 ? `🎉 You won **${winnings.toLocaleString()} 🪙**!` : `😔 You lost **${betAmt.toLocaleString()} 🪙**.`}`).setFooter({ text: `Balance: ${(profile.balance).toLocaleString()} 🪙` })] });
        }
    },
};
export default command;
//# sourceMappingURL=gamble.js.map