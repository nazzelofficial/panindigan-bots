import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('muteall')
    .setDescription('Server-mute all members in a voice channel (owner only — HIGH RISK)')
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Target server ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('channel_id')
        .setDescription('Voice channel ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for muting')
        .setRequired(false)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('server_id', true);
    const channelId = interaction.options.getString('channel_id', true);
    const reason = interaction.options.getString('reason') || 'Muteall by bot owner';

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

    await interaction.reply({ content: `🔇 Muting **${members.size}** members in **${channel.name}**...`, ephemeral: true });

    let muted = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.voice.setMute(true, `[MUTEALL] ${reason} | By: ${interaction.user.tag}`);
        muted++;
      } catch {
        failed++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔇 Muteall Complete')
      .setColor(failed > 0 ? '#ff9900' : '#00ff00')
      .addFields(
        { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
        { name: 'Channel', value: channel.name, inline: true },
        { name: 'Muted', value: muted.toString(), inline: true },
        { name: 'Failed', value: failed.toString(), inline: true },
        { name: 'Reason', value: reason, inline: false },
      )
      .setTimestamp()
      .setFooter({ text: `Executed by ${interaction.user.tag}` });

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
}
