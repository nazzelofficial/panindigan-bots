import { UserModel } from '../../database/models/User';
import { errorEmbed, baseEmbed } from '../../utils/embeds';
const command = {
    name: 'plinko',
    description: 'Play Plinko',
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
        // Simulate plinko with random multiplier
        const multiplier = Math.random() * 10 + 0.1;
        const winnings = Math.floor(bet * multiplier);
        if (winnings > 0) {
            profile.balance += winnings;
            await user.save();
        }
        const embed = baseEmbed(winnings > bet ? 'success' : 'danger')
            .setTitle('🎯 Plinko')
            .setDescription(`Bet: **${bet.toLocaleString()}** coins\nMultiplier: **${multiplier.toFixed(2)}x**\nWinnings: **${winnings.toLocaleString()}** coins`)
            .setFooter({ text: winnings > 0 ? `New balance: ${(profile.balance).toLocaleString()} coins` : '' });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=plinko.js.map