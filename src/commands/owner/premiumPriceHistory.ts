import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_price_history')
    .setDescription('View price change history of a Premium tier')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Premium tier or pack')
        .setRequired(true)
        .addChoices(
          { name: 'Basic', value: 'basic' },
          { name: 'Standard', value: 'standard' },
          { name: 'Gold', value: 'gold' },
          { name: 'Enterprise', value: 'enterprise' },
          { name: '3-Server Pack', value: '3-server' },
          { name: '5-Server Pack', value: '5-server' },
          { name: '10-Server Pack', value: '10-server' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const tier = interaction.options.getString('tier', true);
    
    const system = await SystemModel.findOne({});
    const priceHistory = (system as any)?.premiumPriceHistory || [];
    
    const tierHistory = priceHistory.filter((h: any) => h.tier === tier);
    
    if (tierHistory.length === 0) {
      return interaction.reply({ content: `❌ No price history found for ${tier}`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`💰 Price History: ${tier.toUpperCase()}`)
      .setColor('#ffd700')
      .setDescription(tierHistory.map((h: any) => 
        `${h.date.toLocaleString()}: ₱${h.oldPrice} → ₱${h.newPrice} (by ${h.changedBy})`
      ).join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
