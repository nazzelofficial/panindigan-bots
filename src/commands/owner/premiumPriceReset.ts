import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_price_reset')
    .setDescription('Reset the price of a Premium tier to default')
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
    
    const defaultPrices = {
      basic: 50,
      standard: 150,
      gold: 350,
      enterprise: 600,
      '3-server': 499,
      '5-server': 799,
      '10-server': 1199
    };
    
    const system = await SystemModel.findOne({});
    const prices = (system as any)?.premiumPrices || { ...defaultPrices };
    
    prices[tier as keyof typeof prices] = defaultPrices[tier as keyof typeof defaultPrices];
    
    await SystemModel.findOneAndUpdate(
      {},
      { premiumPrices: prices },
      { upsert: true }
    );
    
    await interaction.reply({ 
      content: `✅ Reset ${tier} price to ₱${defaultPrices[tier as keyof typeof defaultPrices]}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
