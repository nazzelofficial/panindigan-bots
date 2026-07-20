import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { UserModel } from '../../database/models/User.js';
import { errorEmbed, baseEmbed } from '../../utils/embeds.js';

// Payout multipliers: index = number of picks, value = [multiplier per match count]
// payouts[picks][matches] = multiplier
const PAYOUTS: Record<number, Record<number, number>> = {
  1:  { 1: 3 },
  2:  { 2: 12 },
  3:  { 2: 1, 3: 40 },
  4:  { 2: 1, 3: 5,  4: 100 },
  5:  { 3: 2, 4: 15, 5: 300 },
  6:  { 3: 2, 4: 8,  5: 50,  6: 1000 },
  7:  { 3: 1, 4: 5,  5: 20,  6: 100,  7: 2000 },
  8:  { 4: 3, 5: 12, 6: 50,  7: 500,  8: 5000 },
  9:  { 4: 2, 5: 8,  6: 30,  7: 200,  8: 1000, 9: 10000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 500,  9: 2500, 10: 25000 },
};

const command: CommandDefinition = {
  name: 'keno',
  description: 'Play Keno — pick 1–10 numbers (1–80), 20 are drawn, win based on matches!',
  category: 'Games',
  access: 'general',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption(o => o.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(10).setMaxValue(50_000))
      .addStringOption(o =>
        o.setName('numbers').setDescription('Your picks, space-separated (e.g. "5 12 33 67 80")').setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bet = ctx.isSlash ? ctx.interaction!.options.getInteger('bet', true) : parseInt(ctx.args[0] ?? '0');
    const input = ctx.isSlash ? ctx.interaction!.options.getString('numbers', true) : ctx.args.slice(1).join(' ');

    if (!bet || bet < 10 || bet > 50_000) {
      await ctx.reply({ embeds: [errorEmbed('Bet must be between 10 and 50,000 coins.')] });
      return;
    }

    // Parse and validate picks
    const rawNums = input.split(/[\s,]+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    const picks = [...new Set(rawNums)].filter(n => n >= 1 && n <= 80);

    if (picks.length < 1 || picks.length > 10) {
      await ctx.reply({ embeds: [errorEmbed('Pick between **1 and 10 unique numbers** from 1 to 80.')] });
      return;
    }
    if (rawNums.length !== picks.length) {
      await ctx.reply({ embeds: [errorEmbed('Numbers must be unique and between 1 and 80.')] });
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

    // Draw 20 random numbers from 1-80
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const drawn = pool.slice(0, 20).sort((a, b) => a - b);

    const matches = picks.filter(p => drawn.includes(p));
    const matchCount = matches.length;
    const payoutTable = PAYOUTS[picks.length] ?? {};
    const multiplier = payoutTable[matchCount] ?? 0;
    const payout = multiplier * bet;

    if (payout > 0) {
      (profile as any).balance += payout;
      await user.save();
    }

    const picksDisplay = picks.sort((a, b) => a - b).map(n => drawn.includes(n) ? `**${n}** ✅` : `${n}`).join(' ');
    const drawnDisplay = drawn.map(n => picks.includes(n) ? `**${n}**` : `${n}`).join(' ');

    const color = payout > bet ? 0x00C851 : payout > 0 ? 0xFFAA00 : 0xFF4444;
    const result = payout > bet
      ? `🎉 **${matchCount} match${matchCount !== 1 ? 'es' : ''}!** You won **${(payout - bet).toLocaleString()}** coins (${multiplier}×)!`
      : payout > 0
      ? `↩️ **${matchCount} match${matchCount !== 1 ? 'es' : ''}** — bet returned.`
      : `❌ **${matchCount} match${matchCount !== 1 ? 'es' : ''}** — you lost **${bet.toLocaleString()}** coins.`;

    const embed = new EmbedBuilder()
      .setTitle('🎰 Keno')
      .setColor(color)
      .addFields(
        { name: `Your Picks (${picks.length})`, value: picksDisplay, inline: false },
        { name: '20 Numbers Drawn', value: drawnDisplay, inline: false },
        { name: '✅ Matches', value: `${matchCount}/${picks.length}`, inline: true },
        { name: '💰 Result', value: payout > 0 ? `+${(payout - bet).toLocaleString()} coins` : `-${bet.toLocaleString()} coins`, inline: true },
      )
      .setDescription(result)
      .setFooter({ text: `Bet: ${bet.toLocaleString()} coins` })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
