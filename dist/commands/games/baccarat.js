import { EmbedBuilder } from 'discord.js';
import { UserModel } from '../../database/models/User';
import { errorEmbed } from '../../utils/embeds';
// Baccarat card value: 10/J/Q/K = 0, A = 1, others = face
function baccaratValue(rank) {
    if (['10', 'J', 'Q', 'K'].includes(rank))
        return 0;
    if (rank === 'A')
        return 1;
    return parseInt(rank, 10);
}
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];
function buildDeck() {
    const d = [];
    for (const s of SUITS)
        for (const r of RANKS)
            d.push({ rank: r, suit: s });
    return d;
}
function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function handVal(hand) {
    return hand.reduce((s, c) => s + baccaratValue(c.rank), 0) % 10;
}
function fmtCard(c) {
    return `\`${c.rank}${c.suit}\``;
}
const command = {
    name: 'baccarat',
    description: 'Play Baccarat — bet on Player, Banker, or Tie!',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addIntegerOption(o => o.setName('bet').setDescription('Amount to wager').setRequired(true).setMinValue(10).setMaxValue(100_000))
        .addStringOption(o => o.setName('choice').setDescription('Your bet').setRequired(true)
        .addChoices({ name: 'Player (1:1)', value: 'player' }, { name: 'Banker (0.95:1)', value: 'banker' }, { name: 'Tie (8:1)', value: 'tie' })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger('bet', true) : parseInt(ctx.args[1] ?? '0');
        const choice = ctx.isSlash ? ctx.interaction.options.getString('choice', true) : ctx.args[0]?.toLowerCase();
        if (!bet || bet < 10 || bet > 100_000) {
            await ctx.reply({ embeds: [errorEmbed('Bet must be between 10 and 100,000 coins.')] });
            return;
        }
        if (!choice || !['player', 'banker', 'tie'].includes(choice)) {
            await ctx.reply({ embeds: [errorEmbed('Choose: player, banker, or tie.')] });
            return;
        }
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        const balance = profile.balance ?? 0;
        if (balance < bet) {
            await ctx.reply({ embeds: [errorEmbed(`Insufficient balance. You have **${balance.toLocaleString()}** coins.`)] });
            return;
        }
        profile.balance -= bet;
        await user.save();
        const deck = shuffle(buildDeck());
        let di = 0;
        const deal = () => deck[di++];
        const playerHand = [deal(), deal()];
        const bankerHand = [deal(), deal()];
        let pVal = handVal(playerHand);
        let bVal = handVal(bankerHand);
        // Natural check (8 or 9 = no more cards)
        const isNatural = pVal >= 8 || bVal >= 8;
        if (!isNatural) {
            // Player third card
            if (pVal <= 5)
                playerHand.push(deal());
            pVal = handVal(playerHand);
            const playerDrewThird = playerHand.length === 3;
            const playerThirdVal = playerDrewThird ? baccaratValue(playerHand[2].rank) : -1;
            // Banker third card (proper rules)
            const bankerDraws = (() => {
                if (!playerDrewThird)
                    return bVal <= 5;
                if (bVal <= 2)
                    return true;
                if (bVal === 3)
                    return playerThirdVal !== 8;
                if (bVal === 4)
                    return playerThirdVal >= 2 && playerThirdVal <= 7;
                if (bVal === 5)
                    return playerThirdVal >= 4 && playerThirdVal <= 7;
                if (bVal === 6)
                    return playerThirdVal === 6 || playerThirdVal === 7;
                return false; // bVal 7: stand
            })();
            if (bankerDraws)
                bankerHand.push(deal());
            bVal = handVal(bankerHand);
        }
        const winner = pVal > bVal ? 'player' : bVal > pVal ? 'banker' : 'tie';
        let payout = 0;
        let resultText;
        let color;
        if (winner === 'tie') {
            if (choice === 'tie') {
                payout = bet * 9; // 8:1 + original bet back
                resultText = `🎉 **Tie!** You won **${(payout - bet).toLocaleString()}** coins (8:1)!`;
                color = 0xFFD700;
            }
            else {
                payout = bet; // push: return original bet
                resultText = `🤝 **Tie!** Your bet has been returned.`;
                color = 0xFFAA00;
            }
            profile.balance += payout;
        }
        else if (choice === winner) {
            if (winner === 'player') {
                payout = bet * 2;
                resultText = `🎉 **Player wins!** You won **${bet.toLocaleString()}** coins!`;
            }
            else {
                payout = Math.floor(bet * 1.95); // 5% commission
                resultText = `🎉 **Banker wins!** You won **${(payout - bet).toLocaleString()}** coins (after 5% commission)!`;
            }
            color = 0x00C851;
            profile.balance += payout;
        }
        else {
            resultText = winner === 'player' ? `❌ **Player wins** — you bet on ${choice} and lost **${bet.toLocaleString()}** coins.` : `❌ **Banker wins** — you bet on ${choice} and lost **${bet.toLocaleString()}** coins.`;
            color = 0xFF4444;
        }
        await user.save();
        const embed = new EmbedBuilder()
            .setTitle('🎴 Baccarat')
            .setColor(color)
            .addFields({ name: `Player (${pVal})`, value: playerHand.map(fmtCard).join(' '), inline: true }, { name: `Banker (${bVal})`, value: bankerHand.map(fmtCard).join(' '), inline: true })
            .setDescription(resultText)
            .setFooter({ text: `Bet: ${bet.toLocaleString()} coins • You bet on: ${choice}` })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=baccarat.js.map