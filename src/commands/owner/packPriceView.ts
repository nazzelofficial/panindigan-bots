import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_price_view')
    .setDescription('View current Server Pack prices'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const system = await SystemModel.findOne({});
    const prices = (system as any)?.serverPackPrices || {
      '3-server': 499,
      '5-server': 799,
      '10-server': 1199
    };
    
    const embed = new EmbedBuilder()
      .setTitle('📦 Server Pack Prices')
      .setColor('#ffd700')
      .addFields(
        { name: '3-Server Pack', value: `₱${prices['3-server']}`, inline: true },
        { name: '5-Server Pack', value: `₱${prices['5-server']}`, inline: true },
        { name: '10-Server Pack', value: `₱${prices['10-server']}`, inline: true }
      )
      .setDescription('All Server Packs include Enterprise Premium for all included servers')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
