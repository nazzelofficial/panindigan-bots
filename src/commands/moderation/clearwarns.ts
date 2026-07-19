import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { ModCaseModel } from '@/database/models/Moderation';
import { successEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'clearwarns',
  description: 'Clear all warnings for a user',
  category: 'Moderation',
  access: 'moderator',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to clear warnings for')
          .setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const user = ctx.isSlash ? ctx.interaction!.options.getUser('user', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
    
    if (!user) {
      await ctx.reply({ embeds: [successEmbed('Invalid user.')] });
      return;
    }

    await ModCaseModel.deleteMany({ userId: user.id, guildId: guild.id, type: 'warn' });
    
    await ctx.reply({ embeds: [successEmbed(`Cleared all warnings for ${user.tag}`)] });
  },
};
export default command;
