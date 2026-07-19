import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, } from 'discord.js';
import { UserModel } from '@/database/models/User';
import { errorEmbed } from '@/utils/embeds';
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const RANK_LABELS = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
function buildDeck() {
    const d = [];
    for (const s of SUITS)
        for (const r of RANKS)
            d.push({ rank: r, suit: s });
    return d;
}
function shuffle(d) {
    const a = [...d];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function lbl(c) { return `${RANK_LABELS[c.rank]}${c.suit}`; }
const PAYOUTS = {
    'Royal Flush': 800, 'Straight Flush': 50, 'Four of a Kind': 25, 'Full House': 9,
    'Flush': 6, 'Straight': 4, 'Three of a Kind': 3, 'Two Pair': 2, 'Jacks or Better': 1, 'High Card': 0,
};
function evaluateHand(hand) {
    const ranks = hand.map(c => c.rank).sort((a, b) => a - b);
    const suits = hand.map(c => c.suit);
    const counts = {};
    for (const r of ranks)
        counts[r] = (counts[r] ?? 0) + 1;
    const freq = Object.values(counts).sort((a, b) => b - a);
    const isFlush = new Set(suits).size === 1;
    const isStraight = ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5;
    const isWheel = JSON.stringify(ranks) === JSON.stringify([2, 3, 4, 5, 14]);
    const straight = isStraight || isWheel;
    if (isFlush && isStraight && ranks[0] === 10)
        return 'Royal Flush';
    if (isFlush && straight)
        return 'Straight Flush';
    if (freq[0] === 4)
        return 'Four of a Kind';
    if (freq[0] === 3 && freq[1] === 2)
        return 'Full House';
    if (isFlush)
        return 'Flush';
    if (straight)
        return 'Straight';
    if (freq[0] === 3)
        return 'Three of a Kind';
    if (freq[0] === 2 && freq[1] === 2)
        return 'Two Pair';
    if (freq[0] === 2) {
        const pairedRank = Number(Object.keys(counts).find(k => counts[+k] === 2));
        if (pairedRank >= 11)
            return 'Jacks or Better';
    }
    return 'High Card';
}
const command = {
    name: 'poker',
    description: 'Play Video Poker (Jacks or Better) — hold cards and draw for the best hand!',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(100_000)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger('bet', true) : parseInt(ctx.args[0] ?? '0');
        if (!bet || bet < 10 || bet > 100_000) {
            await ctx.reply({ embeds: [errorEmbed('Bet must be between 10 and 100,000 coins.')] });
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
            await ctx.reply({ embeds: [errorEmbed(`You only have **${balance.toLocaleString()}** coins.`)] });
            return;
        }
        profile.balance -= bet;
        await user.save();
        const deck = shuffle(buildDeck());
        const hand = deck.splice(0, 5);
        const held = [false, false, false, false, false];
        const makeEmbed = (phase, handName, mult, color) => {
            const cardDisplay = hand.map((c, i) => held[i] ? `**\`${lbl(c)}\`** 🔒` : `\`${lbl(c)}\``).join('  ');
            const e = new EmbedBuilder().setTitle('🃏 Video Poker — Jacks or Better').setColor(color)
                .addFields({ name: 'Your Hand', value: cardDisplay })
                .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` });
            if (phase === 'deal')
                e.setDescription('Toggle cards to **HOLD**, then press **Draw**.');
            else
                e.setDescription(mult > 0 ? `✅ **${handName}** — won **${(mult * bet).toLocaleString()}** coins!` : `❌ **${handName}** — no win.`);
            return e;
        };
        const holdRow = () => new ActionRowBuilder().addComponents(...Array.from({ length: 5 }, (_, i) => new ButtonBuilder().setCustomId(`h${i}`).setLabel(held[i] ? `✅ Hold ${i + 1}` : `Hold ${i + 1}`).setStyle(held[i] ? ButtonStyle.Success : ButtonStyle.Secondary)));
        const drawRow = () => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('draw').setLabel('🎴 Draw').setStyle(ButtonStyle.Primary));
        const msg = await ctx.reply({ embeds: [makeEmbed('deal', 'High Card', 0, 0x5865F2)], components: [holdRow(), drawRow()], fetchReply: true });
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, filter: (i) => i.user.id === ctx.userId, time: 30_000 });
        collector.on('collect', async (btn) => {
            if (btn.customId === 'draw') {
                collector.stop('draw');
                return;
            }
            const idx = parseInt(btn.customId[1], 10);
            held[idx] = !held[idx];
            await btn.update({ embeds: [makeEmbed('deal', 'High Card', 0, 0x5865F2)], components: [holdRow(), drawRow()] });
        });
        collector.on('end', async () => {
            for (let i = 0; i < 5; i++)
                if (!held[i])
                    hand[i] = deck.splice(0, 1)[0];
            const handName = evaluateHand(hand);
            const mult = PAYOUTS[handName];
            const payout = mult * bet;
            if (payout > 0) {
                profile.balance += payout;
                await user.save();
            }
            const color = mult > 0 ? 0x00C851 : 0xFF4444;
            for (let i = 0; i < 5; i++)
                held[i] = true;
            await msg.edit({ embeds: [makeEmbed('result', handName, mult, color)], components: [] }).catch(() => { });
        });
    },
};
export default command;
//# sourceMappingURL=poker.js.map