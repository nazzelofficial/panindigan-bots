import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { ModCaseModel } from '@/database/models/Moderation';
import { baseEmbed, errorEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'history',
  description: 'View full moderation history for a user',
  category: 'Moderation',
  access: 'moderator',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to check')
          .setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = ctx.isSlash ? ctx.interaction!.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
    
    if (!user) {
      await ctx.reply({ embeds: [errorEmbed('Invalid user.')] });
      return;
    }

    const cases = await ModCaseModel.find({ userId: user.id, guildId: guild.id }).sort({ createdAt: -1 });
    
    if (cases.length === 0) {
      await ctx.reply({ embeds: [errorEmbed('No moderation history found for this user')] });
      return;
    }
    
    const embed = baseEmbed('primary')
      .setTitle('📜 Moderation History')
      .setDescription(cases.map(c => `**${c.type.toUpperCase()}**: ${c.reason} - ${new Date(c.createdAt).toLocaleString()}`).join('\n'))
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
