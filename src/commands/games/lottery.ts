import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { UserModel } from '../../database/models/User.js';
import { errorEmbed, baseEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'lottery',
  description: 'Buy a lottery ticket',
  category: 'Games',
  access: 'general',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption(option =>
        option.setName('numbers')
          .setDescription('Number of tickets to buy')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const count = ctx.isSlash ? ctx.interaction!.options.getInteger('numbers', true) : parseInt(ctx.args[0] ?? '1');
    const cost = count * 100;

    if (count < 1 || count > 10) {
      await ctx.reply({ embeds: [errorEmbed('You can buy between 1 and 10 tickets.')] });
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
    if (balance < cost) {
      await ctx.reply({ embeds: [errorEmbed(`Insufficient balance. You need **${cost.toLocaleString()}** coins.`)] });
      return;
    }

    (profile as any).balance -= cost;
    await user.save();

    // Generate random lottery numbers for each ticket
    const tickets: number[][] = [];
    for (let i = 0; i < count; i++) {
      const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1).sort((a, b) => a - b);
      tickets.push(nums);
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Lottery Ticket')
      .setColor('#00ff00')
      .setDescription(`You bought ${count} ticket(s) for ${cost.toLocaleString()} coins`)
      .addFields(
        { name: 'Your Numbers', value: tickets.map((t, i) => `Ticket #${i + 1}: ${t.map(n => n.toString().padStart(2, '0')).join(' ')}`).join('\n'), inline: false },
      )
      .setFooter({ text: 'Lottery draws every Sunday at 8 PM UTC' })
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
