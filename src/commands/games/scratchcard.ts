import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { UserModel } from '../../database/models/User.js';
import { errorEmbed, baseEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'scratchcard',
  description: 'Buy and scratch a scratch card',
  category: 'Games',
  access: 'general',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cost = 50;

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
      await ctx.reply({ embeds: [errorEmbed(`Insufficient balance. You need **${cost.toLocaleString()}** coins to buy a scratch card.`)] });
      return;
    }

    (profile as any).balance -= cost;
    await user.save();

    const prizes = [0, 0, 0, 10, 50, 100, 500, 1000, 5000];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];

    if (prize > 0) {
      (profile as any).balance += prize;
      await user.save();
    }

    const embed = baseEmbed(prize > 0 ? 'success' : 'danger')
      .setTitle('🎫 Scratch Card')
      .setDescription(prize > 0 ? `🎉 You won **${prize.toLocaleString()}** coins!` : `😢 No prize this time.`)
      .addFields(
        { name: 'Cost', value: `${cost.toLocaleString()} coins`, inline: true },
        { name: 'Prize', value: `${prize.toLocaleString()} coins`, inline: true },
        { name: 'Net', value: prize > 0 ? `+${(prize - cost).toLocaleString()} coins` : `-${cost.toLocaleString()} coins`, inline: true },
      )
      .setFooter({ text: prize > 0 ? `New balance: ${((profile as any).balance).toLocaleString()} coins` : '' })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
