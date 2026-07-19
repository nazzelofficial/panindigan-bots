import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BetaFlagModel } from '../../database/models/Premium';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('betaflag')
    .setDescription('Manage beta feature access for servers')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Grant beta feature access to a server')
        .addStringOption(o => o.setName('server_id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove beta access from a server')
        .addStringOption(o => o.setName('server_id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all servers with beta access')),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'add') {
      const guildId = interaction.options.getString('server_id', true);

      const existing = await BetaFlagModel.findOne({ guildId });
      if (existing) {
        return interaction.editReply({ content: `❌ Server \`${guildId}\` already has beta access.` });
      }

      await BetaFlagModel.create({ guildId, grantedBy: interaction.user.id });

      const client = clientRegistry.get()!;
      const serverName = client.guilds.cache.get(guildId)?.name ?? guildId;
      return interaction.editReply({ content: `✅ Beta access granted to **${serverName}** (\`${guildId}\`).` });
    }

    if (sub === 'remove') {
      const guildId = interaction.options.getString('server_id', true);
      const result = await BetaFlagModel.findOneAndDelete({ guildId });

      if (!result) return interaction.editReply({ content: `❌ Server \`${guildId}\` does not have beta access.` });

      const client = clientRegistry.get()!;
      const serverName = client.guilds.cache.get(guildId)?.name ?? guildId;
      return interaction.editReply({ content: `✅ Beta access removed from **${serverName}**.` });
    }

    if (sub === 'list') {
      const betaServers = await BetaFlagModel.find({}).lean() as any[];

      if (betaServers.length === 0) return interaction.editReply({ content: 'ℹ️ No servers have beta access currently.' });

      const client = clientRegistry.get()!;
      const lines = betaServers.map((s: any) => {
        const name = client.guilds.cache.get(s.guildId)?.name ?? s.guildId;
        return `• **${name}** (\`${s.guildId}\`) — Granted <t:${Math.floor(new Date(s.createdAt).getTime() / 1000)}:R> by <@${s.grantedBy}>`;
      });

      const embed = new EmbedBuilder()
        .setTitle('🔬 Beta Access — Server List')
        .setColor('#9B59B6')
        .setDescription(lines.join('\n').slice(0, 4000))
        .setFooter({ text: `${betaServers.length} server(s) with beta access` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
