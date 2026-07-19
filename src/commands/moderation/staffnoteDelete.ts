import { SlashCommandBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { StaffNoteModel } from '@/database/models/Moderation';
import { errorEmbed, successEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'staffnote_delete',
  description: 'Delete a staff note',
  category: 'Moderation',
  access: 'moderator',
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption(option =>
        option.setName('note_id')
          .setDescription('Note ID to delete')
          .setRequired(true)),
  async execute(ctx) {
    const noteId = ctx.isSlash ? ctx.interaction!.options.getString('note_id', true) : ctx.args[0];
    
    const note = await StaffNoteModel.findById(noteId);
    
    if (!note) {
      await ctx.reply({ embeds: [errorEmbed('Note not found')] });
      return;
    }
    
    await StaffNoteModel.findByIdAndDelete(noteId);
    await ctx.reply({ embeds: [successEmbed('Staff note deleted')] });
  },
};
export default command;
