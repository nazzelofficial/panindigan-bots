import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmuteall')
    .setDescription('Server-unmute all members in a voice channel (owner only)')
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Target server ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('channel_id')
        .setDescription('Voice channel ID')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('server_id', true);
    const channelId = interaction.options.getString('channel_id', true);

    const client = clientRegistry.get()!;
    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return interaction.reply({ content: '❌ Server not found in bot cache.', ephemeral: true });
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '❌ Invalid voice channel ID.', ephemeral: true });
    }

    const members = channel.members;
    if (members.size === 0) {
      return interaction.reply({ content: '❌ No members in that voice channel.', ephemeral: true });
    }

    await interaction.reply({ content: `🔊 Unmuting **${members.size}** members in **${channel.name}**...`, ephemeral: true });

    let unmuted = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.voice.setMute(false, `Unmuteall by ${interaction.user.tag}`);
        unmuted++;
      } catch {
        failed++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔊 Unmuteall Complete')
      .setColor(failed > 0 ? '#ff9900' : '#00ff00')
      .addFields(
        { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
        { name: 'Channel', value: channel.name, inline: true },
        { name: 'Unmuted', value: unmuted.toString(), inline: true },
        { name: 'Failed', value: failed.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `Executed by ${interaction.user.tag}` });

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
}
