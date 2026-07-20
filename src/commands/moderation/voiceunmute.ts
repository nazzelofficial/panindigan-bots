import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { sendLogEvent } from '../../features/logging/logEngine.js';
import { baseEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voiceunmute')
    .setDescription('Remove server-mute from a user')
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false)),
  category: 'Moderation',
  accessTier: 'mod',
  memberPermissions: [PermissionFlagsBits.MuteMembers],
  botPermissions: [PermissionFlagsBits.MuteMembers],
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guild = interaction.guild!;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    if (!member.voice.serverMute) return interaction.reply({ content: '❌ That user is not server-muted.', ephemeral: true });

    await member.voice.setMute(false, reason);

    await sendLogEvent(guild.id, 'voiceunmute', () =>
      baseEmbed('success')
        .setTitle('🔊 Voice Unmute')
        .addFields(
          { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: false },
        ),
    );

    return interaction.reply({ content: `✅ **${user.tag}** has been un-muted.`, ephemeral: true });
  },
} as unknown as CommandDefinition;
