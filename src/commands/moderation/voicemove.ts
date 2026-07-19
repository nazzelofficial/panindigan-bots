import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { sendLogEvent } from '../../features/logging/logEngine';
import { baseEmbed } from '../../utils/embeds';

export default {
  data: new SlashCommandBuilder()
    .setName('voicemove')
    .setDescription('Move a user from one voice channel to another')
    .addUserOption(o => o.setName('user').setDescription('User to move').setRequired(true))
    .addChannelOption(o =>
      o.setName('channel').setDescription('Target voice channel').setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)),
  category: 'Moderation',
  accessTier: 'mod',
  memberPermissions: [PermissionFlagsBits.MoveMembers],
  botPermissions: [PermissionFlagsBits.MoveMembers],
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const channel = interaction.options.getChannel('channel', true);
    const guild = interaction.guild!;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
    if (!member.voice.channel) return interaction.reply({ content: '❌ That user is not in a voice channel.', ephemeral: true });
    if (member.voice.channelId === channel.id) return interaction.reply({ content: '❌ That user is already in that channel.', ephemeral: true });

    const fromChannel = member.voice.channel.name;
    await member.voice.setChannel(channel.id);

    await sendLogEvent(guild.id, 'voicemove', () =>
      baseEmbed('info')
        .setTitle('🔀 Voice Move')
        .addFields(
          { name: 'User', value: `${user.tag} (<@${user.id}>)`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'From', value: fromChannel, inline: true },
          { name: 'To', value: String(channel?.name ?? 'unknown'), inline: true },
        ),
    );

    return interaction.reply({ content: `✅ **${user.tag}** moved from **${fromChannel}** → **${channel.name}**.`, ephemeral: true });
  },
} as unknown as CommandDefinition;
