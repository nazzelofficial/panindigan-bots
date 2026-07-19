import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('license_view')
    .setDescription('View bot license information'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const system = await SystemModel.findOne({});
    const license = (system as any)?.license || {
      key: 'N/A',
      type: 'Standard',
      expires: 'Never',
      features: ['all']
    };
    
    const embed = new EmbedBuilder()
      .setTitle('📜 Bot License')
      .setColor('#ffd700')
      .addFields(
        { name: 'License Key', value: license.key, inline: true },
        { name: 'Type', value: license.type, inline: true },
        { name: 'Expires', value: license.expires, inline: true },
        { name: 'Features', value: license.features.join(', '), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
