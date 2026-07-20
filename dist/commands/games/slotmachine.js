import { EmbedBuilder } from 'discord.js';
import { UserModel } from '../../database/models/User.js';
import { errorEmbed } from '../../utils/embeds.js';
const SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣'];
const PAYOUTS = {
    '🍒': 5,
    '🍋': 10,
    '🍊': 15,
    '🍉': 20,
    '⭐': 50,
    '7️⃣': 100,
};
const command = {
    name: 'slotmachine',
    description: 'Play the slot machine',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addIntegerOption(option => option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100_000)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger('bet', true) : parseInt(ctx.args[0] ?? '0');
        if (!bet || bet < 1 || bet > 100_000) {
            await ctx.reply({ embeds: [errorEmbed('Bet must be between 1 and 100,000 coins.')] });
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
        const result = [
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ];
        const allMatch = result[0] === result[1] && result[1] === result[2];
        const twoMatch = result[0] === result[1] || result[1] === result[2] || result[0] === result[2];
        let multiplier = 0;
        if (allMatch) {
            multiplier = PAYOUTS[result[0]];
        }
        else if (twoMatch) {
            multiplier = 2;
        }
        const winnings = multiplier * bet;
        if (winnings > 0) {
            profile.balance += winnings;
            await user.save();
        }
        const color = winnings > bet ? 0x00C851 : winnings > 0 ? 0xFFAA00 : 0xFF4444;
        const description = allMatch
            ? `🎰 **JACKPOT!** Three ${result[0]}!`
            : twoMatch
                ? `🎰 Two matching symbols!`
                : `🎰 No match this time.`;
        const embed = new EmbedBuilder()
            .setTitle('🎰 Slot Machine')
            .setColor(color)
            .setDescription(`${description}\n\n${result.join(' ')}`)
            .addFields({ name: 'Bet', value: `${bet.toLocaleString()} coins`, inline: true }, { name: 'Winnings', value: `${winnings.toLocaleString()} coins`, inline: true }, { name: 'Multiplier', value: `${multiplier}x`, inline: true })
            .setFooter({ text: winnings > 0 ? `New balance: ${(profile.balance).toLocaleString()} coins` : '' })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=slotmachine.js.map