import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_price_set')
    .setDescription('Change the price of a Premium tier')
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
        ))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('New price in PHP')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1200)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const tier = interaction.options.getString('tier', true);
    const amount = interaction.options.getInteger('amount', true);
    
    const system = await SystemModel.findOne({});
    const prices = (system as any)?.premiumPrices || {
      basic: 50,
      standard: 150,
      gold: 350,
      enterprise: 600,
      '3-server': 499,
      '5-server': 799,
      '10-server': 1199
    };
    
    prices[tier as keyof typeof prices] = amount;
    
    await SystemModel.findOneAndUpdate(
      {},
      { premiumPrices: prices },
      { upsert: true }
    );
    
    await interaction.reply({ 
      content: `✅ Updated ${tier} price to ₱${amount}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
