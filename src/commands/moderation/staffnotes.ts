import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { StaffNoteModel } from '@/database/models/Moderation';
import { baseEmbed, errorEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'staffnotes',
  description: 'View staff notes for a user',
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

    const notes = await StaffNoteModel.find({ userId: user.id, guildId: guild.id });
    
    if (notes.length === 0) {
      await ctx.reply({ embeds: [errorEmbed('No staff notes found for this user')] });
      return;
    }
    
    const embed = baseEmbed('primary')
      .setTitle('📝 Staff Notes')
      .setDescription(notes.map(n => `**${new Date(n.createdAt).toLocaleString()}**: ${n.note}`).join('\n'))
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
