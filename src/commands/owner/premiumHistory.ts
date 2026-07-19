import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { PremiumModel } from '../../database/models/Premium';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_history')
    .setDescription('View Premium history of a server')
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Server ID')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('server_id', true);
    
    const premium = await PremiumModel.findOne({ guildId: serverId });
    
    if (!premium) {
      return interaction.reply({ content: '❌ Server does not have Premium history', ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`💎 Premium History: ${serverId}`)
      .setColor('#ffd700')
      .addFields(
        { name: 'Current Tier', value: premium.tier.toUpperCase(), inline: true },
        { name: 'Granted At', value: (premium as any)?.grantedAt?.toLocaleString() || 'Unknown', inline: true },
        { name: 'Granted By', value: premium.grantedBy || 'Unknown', inline: true },
        { name: 'History Changes', value: premium.history?.length.toString() || '0', inline: true }
      )
      .setTimestamp();
    
    if (premium.history && premium.history.length > 0) {
      embed.setDescription(premium.history.map((h: any) => 
        `${h.date.toLocaleString()}: ${h.action} - ${h.tier.toUpperCase()} (by ${h.by})`
      ).join('\n'));
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
