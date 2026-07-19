import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { UserModel } from '@/database/models/User';
import { baseEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'xp',
  description: 'View your XP',
  category: 'Leveling',
  access: 'general',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = await UserModel.findOne({ userId: ctx.userId });
    let profile = user?.guilds.find((g: any) => g.guildId === guild.id);
    
    const xp = profile?.xp || 0;
    const totalXp = (profile as any)?.totalXp || 0;
    
    const embed = baseEmbed('primary')
      .setTitle('⭐ XP Information')
      .addFields(
        { name: 'Current XP', value: xp.toString(), inline: true },
        { name: 'Total XP', value: totalXp.toString(), inline: true }
      )
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
