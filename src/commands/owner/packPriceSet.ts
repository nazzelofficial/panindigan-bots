import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_price_set')
    .setDescription('Change the price of a Server Pack')
    .addStringOption(option =>
      option.setName('pack')
        .setDescription('Server pack')
        .setRequired(true)
        .addChoices(
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
    const pack = interaction.options.getString('pack', true);
    const amount = interaction.options.getInteger('amount', true);
    
    const system = await SystemModel.findOne({});
    const prices = (system as any)?.serverPackPrices || {
      '3-server': 499,
      '5-server': 799,
      '10-server': 1199
    };
    
    prices[pack as keyof typeof prices] = amount;
    
    await SystemModel.findOneAndUpdate(
      {},
      { serverPackPrices: prices },
      { upsert: true }
    );
    
    await interaction.reply({ 
      content: `✅ Updated ${pack} price to ₱${amount}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
