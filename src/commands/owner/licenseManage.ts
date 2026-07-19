import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { LicenseModel } from '../../database/models/Premium';
import crypto from 'node:crypto';

function generateLicenseKey(): string {
  return `PAN-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('license')
    .setDescription('Manage white-label license keys (Enterprise)')
    .addSubcommand(sub =>
      sub.setName('generate')
        .setDescription('Generate a white-label license key for a server')
        .addStringOption(o => o.setName('server_id').setDescription('Server ID').setRequired(true))
        .addStringOption(o => o.setName('white_label_name').setDescription('White-label bot name').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('revoke')
        .setDescription('Revoke a white-label license key')
        .addStringOption(o => o.setName('key').setDescription('License key to revoke').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all active white-label licenses')),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'generate') {
      const guildId = interaction.options.getString('server_id', true);
      const whiteLabelName = interaction.options.getString('white_label_name') ?? null;

      // Revoke any existing license for this server first
      await LicenseModel.findOneAndUpdate({ guildId }, { active: false });

      const licenseKey = generateLicenseKey();
      await LicenseModel.create({ guildId, licenseKey, whiteLabelName, active: true });

      const embed = new EmbedBuilder()
        .setTitle('🔑 License Key Generated')
        .setColor('#FFD700')
        .addFields(
          { name: 'License Key', value: `\`${licenseKey}\``, inline: false },
          { name: 'Server ID', value: guildId, inline: true },
          { name: 'Issued', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        );
      if (whiteLabelName) embed.addFields({ name: 'White-Label Name', value: whiteLabelName, inline: true });
      embed.setTimestamp().setFooter({ text: `Issued by ${interaction.user.tag}` });

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'revoke') {
      const key = interaction.options.getString('key', true);
      const result = await LicenseModel.findOneAndUpdate({ licenseKey: key }, { active: false }, { new: true });

      if (!result) return interaction.editReply({ content: `❌ License key \`${key}\` not found.` });
      return interaction.editReply({ content: `✅ License key \`${key}\` has been revoked.` });
    }

    if (sub === 'list') {
      const active = await LicenseModel.find({ active: true }).lean() as any[];

      if (active.length === 0) return interaction.editReply({ content: 'ℹ️ No active white-label licenses.' });

      const lines = active.map((l: any) =>
        `• \`${l.licenseKey}\` — Server: \`${l.guildId}\`${l.whiteLabelName ? ` (**${l.whiteLabelName}**)` : ''}\n  Issued <t:${Math.floor(new Date(l.createdAt).getTime() / 1000)}:R>`
      );

      const embed = new EmbedBuilder()
        .setTitle('🔑 Active White-Label Licenses')
        .setColor('#FFD700')
        .setDescription(lines.join('\n\n').slice(0, 4000))
        .setFooter({ text: `${active.length} active license(s)` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
