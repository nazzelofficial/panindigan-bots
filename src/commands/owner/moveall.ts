import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('moveall')
    .setDescription('Move all members from one voice channel to another (owner only — HIGH RISK)')
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Target server ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('from_channel')
        .setDescription('Source voice channel ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('to_channel')
        .setDescription('Destination voice channel ID')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('server_id', true);
    const fromId = interaction.options.getString('from_channel', true);
    const toId = interaction.options.getString('to_channel', true);

    const client = clientRegistry.get()!;
    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return interaction.reply({ content: '❌ Server not found in bot cache.', ephemeral: true });
    }

    const fromChannel = guild.channels.cache.get(fromId);
    const toChannel = guild.channels.cache.get(toId);

    if (!fromChannel || fromChannel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: '❌ Invalid source voice channel ID.', ephemeral: true });
    }
    if (!toChannel || (toChannel.type !== ChannelType.GuildVoice && toChannel.type !== ChannelType.GuildStageVoice)) {
      return interaction.reply({ content: '❌ Invalid destination voice channel ID.', ephemeral: true });
    }

    const members = fromChannel.members;
    if (members.size === 0) {
      return interaction.reply({ content: '❌ No members in the source voice channel.', ephemeral: true });
    }

    await interaction.reply({ content: `🔀 Moving **${members.size}** members from **${fromChannel.name}** → **${toChannel.name}**...`, ephemeral: true });

    let moved = 0;
    let failed = 0;

    for (const [, member] of members) {
      try {
        await member.voice.setChannel(toId, `Moveall by ${interaction.user.tag}`);
        moved++;
      } catch {
        failed++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔀 Moveall Complete')
      .setColor(failed > 0 ? '#ff9900' : '#00ff00')
      .addFields(
        { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
        { name: 'From', value: fromChannel.name, inline: true },
        { name: 'To', value: toChannel.name, inline: true },
        { name: 'Moved', value: moved.toString(), inline: true },
        { name: 'Failed', value: failed.toString(), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: `Executed by ${interaction.user.tag}` });

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
}
