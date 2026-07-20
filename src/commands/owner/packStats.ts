import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_stats')
    .setDescription('View complete Server Pack statistics'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const premiums = await PremiumModel.find({ packId: { $exists: true } });
    const system = await SystemModel.findOne({});
    const prices = (system as any)?.serverPackPrices || {
      '3-server': 499,
      '5-server': 799,
      '10-server': 1199
    };
    
    const packMap = new Map<string, number>();
    premiums.forEach((p: any) => {
      const count = packMap.get(p.packId) || 0;
      packMap.set(p.packId, count + 1);
    });
    
    const totalPacks = packMap.size;
    const totalServers = premiums.length;
    const avgSize = totalPacks > 0 ? (totalServers / totalPacks).toFixed(1) : 0;
    
    const estimatedRevenue = totalPacks * 799;
    
    const embed = new EmbedBuilder()
      .setTitle('📦 Server Pack Statistics')
      .setColor('#ffd700')
      .addFields(
        { name: 'Total Packs', value: totalPacks.toString(), inline: true },
        { name: 'Total Servers', value: totalServers.toString(), inline: true },
        { name: 'Average Pack Size', value: avgSize.toString(), inline: true },
        { name: '3-Server Pack Price', value: `₱${prices['3-server']}`, inline: true },
        { name: '5-Server Pack Price', value: `₱${prices['5-server']}`, inline: true },
        { name: '10-Server Pack Price', value: `₱${prices['10-server']}`, inline: true },
        { name: 'Estimated Revenue', value: `₱${estimatedRevenue.toLocaleString()}`, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
