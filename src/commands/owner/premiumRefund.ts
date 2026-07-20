import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_refund')
    .setDescription('Record a refunded Premium purchase and revoke Premium')
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Server ID to refund')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverId = interaction.options.getString('server_id', true);
    
    const premium = await PremiumModel.findOne({ guildId: serverId });
    
    if (!premium) {
      return interaction.reply({ content: '❌ Server does not have Premium', ephemeral: true });
    }
    
    premium.history = premium.history || [];
    premium.history.push({
      date: new Date(),
      action: 'refund',
      tier: premium.tier,
      by: interaction.user.id
    });
    
    await premium.save();
    
    await PremiumModel.findOneAndDelete({ guildId: serverId });
    
    await interaction.reply({ 
      content: `✅ Recorded refund and revoked Premium for server ${serverId}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
