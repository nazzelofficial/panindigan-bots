import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { UserModel } from '../../database/models/User.js';
import { errorEmbed, baseEmbed } from '../../utils/embeds.js';

/**
 * Crash Game — set an auto-cashout target multiplier.
 * The game generates a random crash point using a house-edge formula.
 * If the crash point >= your target, you win bet × target.
 * If not, you lose your bet.
 */
function generateCrashPoint(): number {
  // 1% house edge: crash at 1.00x ~1% of the time (instant bust)
  const r = Math.random();
  if (r < 0.01) return 1.0;
  // Otherwise: crash = 99 / (100 * r), floored to 2dp, min 1.01
  return Math.max(1.01, Math.floor((99 / (100 * r)) * 100) / 100);
}

const command: CommandDefinition = {
  name: 'crash',
  description: 'Play Crash — set a target multiplier and cash out before the crash!',
  category: 'Games',
  access: 'general',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(100_000))
      .addNumberOption(o =>
        o.setName('target').setDescription('Auto cash-out multiplier (e.g. 2.0 for 2×)').setRequired(true).setMinValue(1.01).setMaxValue(100)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger('bet', true) : parseInt(ctx.args[0] ?? '0');
    const target = ctx.isSlash ? Math.round(ctx.interaction!.options.getNumber('target', true) * 100) / 100 : parseFloat(ctx.args[1] ?? '1.01');

    if (!bet || bet < 10 || bet > 100_000) {
      await ctx.reply({ embeds: [errorEmbed('Bet must be between 10 and 100,000 coins.')] });
      return;
    }

    if (target < 1.01 || target > 100) {
      await ctx.reply({ embeds: [errorEmbed('Target must be between 1.01 and 100.')] });
      return;
    }

    const user = await UserModel.findOneAndUpdate(
      { userId: ctx.userId },
      { $setOnInsert: { userId: ctx.userId } },
      { upsert: true, new: true },
    );
    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      user.guilds.push({ guildId: guild.id } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    const balance = (profile as any).balance ?? 0;
    if (balance < bet) {
      await ctx.reply({ embeds: [errorEmbed(`Insufficient balance. You have **${balance.toLocaleString()}** coins.`)] });
      return;
    }

    (profile as any).balance -= bet;
    await user.save();

    const crashPoint = generateCrashPoint();
    const won = crashPoint >= target;
    let payout = 0;
    let color: number;
    let description: string;

    if (won) {
      payout = Math.floor(bet * target);
      (profile as any).balance += payout;
      await user.save();
      color = 0x00C851;
      description = `📈 Crashed at **${crashPoint.toFixed(2)}×** — your target was **${target.toFixed(2)}×**\n\n✅ **Cashed out!** You won **${(payout - bet).toLocaleString()}** coins (${target.toFixed(2)}×)!`;
    } else {
      color = 0xFF4444;
      description = `💥 Crashed at **${crashPoint.toFixed(2)}×** — your target was **${target.toFixed(2)}×**\n\n❌ Crashed before your target. You lost **${bet.toLocaleString()}** coins.`;
    }

    // Visual crash chart (ASCII)
    const bars = Math.min(Math.floor(crashPoint * 3), 15);
    const chart = Array.from({ length: bars }, (_, i) => {
      const mult = 1 + (i * (crashPoint - 1)) / Math.max(bars - 1, 1);
      const filled = '█'.repeat(Math.round(mult * 2));
      return `${mult.toFixed(1)}× ${filled}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('📈 Crash Game')
      .setColor(color)
      .setDescription(description)
      .addFields(
        { name: '🎯 Your Target', value: `${target.toFixed(2)}×`, inline: true },
        { name: '💥 Crash Point', value: `${crashPoint.toFixed(2)}×`, inline: true },
        { name: '💰 Payout', value: won ? `+${(payout - bet).toLocaleString()} coins` : `-${bet.toLocaleString()} coins`, inline: true },
      )
      .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
