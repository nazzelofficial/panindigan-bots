import { EmbedBuilder } from 'discord.js';
import { UserModel } from '@/database/models/User';
import { errorEmbed } from '@/utils/embeds';
/**
 * Limbo — pick a target multiplier. The game generates a random result.
 * If result >= target, you win bet × target. 1% house edge built in.
 * The higher your target, the lower your chances.
 *
 * P(win at target X) ≈ 1/X × 0.99
 */
function generateResult() {
    const r = Math.random();
    if (r < 0.01)
        return 1.0; // house edge: instant bust 1% of time
    return Math.max(1.0, Math.floor((99 / (100 * r)) * 100) / 100);
}
const command = {
    name: 'limbo',
    description: 'Play Limbo — pick a target multiplier and win if the result beats it!',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(100_000))
        .addNumberOption(o => o.setName('target').setDescription('Target multiplier (1.01× – 1000×)').setRequired(true).setMinValue(1.01).setMaxValue(1000)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger('bet', true) : parseInt(ctx.args[0] ?? '0');
        const target = ctx.isSlash ? Math.round(ctx.interaction.options.getNumber('target', true) * 100) / 100 : parseFloat(ctx.args[1] ?? '1.01');
        if (!bet || bet < 10 || bet > 100_000) {
            await ctx.reply({ embeds: [errorEmbed('Bet must be between 10 and 100,000 coins.')] });
            return;
        }
        if (target < 1.01 || target > 1000) {
            await ctx.reply({ embeds: [errorEmbed('Target must be between 1.01 and 1000.')] });
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
        const result = generateResult();
        const won = result >= target;
        let payout = 0;
        let description;
        let color;
        if (won) {
            payout = Math.floor(bet * target);
            profile.balance += payout;
            await user.save();
            color = 0x00C851;
            description = `🎉 **Result: ${result.toFixed(2)}×** ≥ Target: ${target.toFixed(2)}×\nYou won **${(payout - bet).toLocaleString()}** coins!`;
        }
        else {
            color = 0xFF4444;
            description = `❌ **Result: ${result.toFixed(2)}×** < Target: ${target.toFixed(2)}×\nYou lost **${bet.toLocaleString()}** coins.`;
        }
        // Win chance indicator
        const winChance = Math.min(99, (99 / target)).toFixed(1);
        const embed = new EmbedBuilder()
            .setTitle('🎯 Limbo')
            .setColor(color)
            .setDescription(description)
            .addFields({ name: '🎯 Your Target', value: `${target.toFixed(2)}×`, inline: true }, { name: '🎲 Result', value: `${result.toFixed(2)}×`, inline: true }, { name: '📊 Win Chance', value: `~${winChance}%`, inline: true }, { name: '💰 Net', value: won ? `+${(payout - bet).toLocaleString()}` : `-${bet.toLocaleString()}`, inline: true })
            .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=limbo.js.map