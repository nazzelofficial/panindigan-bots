import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '../../structures/types.js';
import { UserModel } from '../../database/models/User.js';
import { successEmbed } from '../../utils/embeds.js';

const command: CommandDefinition = {
  name: 'xp_set',
  description: 'Set user XP to specific amount (admin only)',
  category: 'Leveling',
  access: 'admin',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to set XP for')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('amount')
          .setDescription('Amount of XP')
          .setRequired(true)
          .setMinValue(0)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
    const amount = ctx.isSlash ? ctx.interaction!.options.getInteger('amount', true) : parseInt(ctx.args[1] ?? '0');
    
    if (!targetUser) {
      await ctx.reply({ embeds: [successEmbed('Invalid user.')] });
      return;
    }

    const user = await UserModel.findOneAndUpdate(
      { userId: targetUser.id },
      { $setOnInsert: { userId: targetUser.id } },
      { upsert: true, new: true },
    );
    let profile = user.guilds.find((g: any) => g.guildId === guild.id);
    if (!profile) {
      user.guilds.push({ guildId: guild.id } as any);
      await user.save();
      profile = user.guilds[user.guilds.length - 1];
    }

    (profile as any).xp = amount;
    (profile as any).totalXp = amount;
    await user.save();
    
    await ctx.reply({ embeds: [successEmbed(`Set ${targetUser.tag}'s XP to ${amount}`)] });
  },
};
export default command;
