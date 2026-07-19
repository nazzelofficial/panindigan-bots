import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { ModCaseModel } from '@/database/models/Moderation';
import { baseEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'modstats',
  description: 'View moderation statistics',
  category: 'Moderation',
  access: 'moderator',
  guildOnly: true,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cases = await ModCaseModel.find({ guildId: guild.id });
    
    const stats = {
      warn: cases.filter(c => c.type === 'warn').length,
      kick: cases.filter(c => c.type === 'kick').length,
      ban: cases.filter(c => c.type === 'ban').length,
      mute: cases.filter(c => c.type === 'mute').length,
      total: cases.length
    };
    
    const embed = baseEmbed('primary')
      .setTitle('📊 Moderation Statistics')
      .addFields(
        { name: 'Total Actions', value: stats.total.toString(), inline: true },
        { name: 'Warnings', value: stats.warn.toString(), inline: true },
        { name: 'Kicks', value: stats.kick.toString(), inline: true },
        { name: 'Bans', value: stats.ban.toString(), inline: true },
        { name: 'Mutes', value: stats.mute.toString(), inline: true }
      )
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
