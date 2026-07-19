import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { clientRegistry } from '../../structures/clientRegistry';
import { GuildModel } from '../../database/models/Guild';

export default {
  data: new SlashCommandBuilder()
    .setName('raidmode')
    .setDescription('Enable or disable temporary raid lockdown on a server (owner only)')
    .addSubcommand(sub =>
      sub.setName('on')
        .setDescription('Enable raid mode on a server')
        .addStringOption(option =>
          option.setName('server_id').setDescription('Target server ID').setRequired(true))
        .addStringOption(option =>
          option.setName('reason').setDescription('Reason for raid mode').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('off')
        .setDescription('Disable raid mode on a server')
        .addStringOption(option =>
          option.setName('server_id').setDescription('Target server ID').setRequired(true))),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const serverId = interaction.options.getString('server_id', true);
    const reason = interaction.options.getString('reason') || 'Raid detected — owner override';

    const client = clientRegistry.get()!;
    const guild = client.guilds.cache.get(serverId);

    if (!guild) {
      return interaction.reply({ content: '❌ Server not found in bot cache.', ephemeral: true });
    }

    const enabled = subcommand === 'on';

    try {
      await GuildModel.findOneAndUpdate(
        { guildId: serverId },
        { 'settings.raidMode': enabled, 'settings.raidModeReason': reason },
        { upsert: true },
      );

      if (enabled) {
        // Lock all non-admin channels by denying SendMessages for @everyone
        let locked = 0;
        for (const [, channel] of guild.channels.cache) {
          if (!channel.isTextBased()) continue;
          try {
            await (channel as any).permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: `[RAIDMODE ON] ${reason}` });
            locked++;
          } catch { /* skip channels where we lack permission */ }
        }

        const embed = new EmbedBuilder()
          .setTitle('🚨 Raid Mode ENABLED')
          .setColor('#ff0000')
          .addFields(
            { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
            { name: 'Channels Locked', value: locked.toString(), inline: true },
            { name: 'Reason', value: reason, inline: false },
          )
          .setTimestamp()
          .setFooter({ text: `Activated by ${interaction.user.tag}` });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Restore SendMessages for @everyone
        let unlocked = 0;
        for (const [, channel] of guild.channels.cache) {
          if (!channel.isTextBased()) continue;
          try {
            await (channel as any).permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }, { reason: `[RAIDMODE OFF] Raid mode lifted by ${interaction.user.tag}` });
            unlocked++;
          } catch { /* skip */ }
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Raid Mode DISABLED')
          .setColor('#00ff00')
          .addFields(
            { name: 'Server', value: `${guild.name} (\`${guild.id}\`)`, inline: true },
            { name: 'Channels Restored', value: unlocked.toString(), inline: true },
          )
          .setTimestamp()
          .setFooter({ text: `Deactivated by ${interaction.user.tag}` });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (error: any) {
      return interaction.reply({ content: `❌ Failed to set raid mode: ${error.message}`, ephemeral: true });
    }
  },
}
