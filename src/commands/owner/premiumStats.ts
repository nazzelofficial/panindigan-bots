import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_stats')
    .setDescription('View complete Premium statistics'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const premiums = await PremiumModel.find({});
    const codes = await PremiumModel.find({ code: { $exists: true } });
    
    const tierCounts = { basic: 0, standard: 0, gold: 0, enterprise: 0 };
    premiums.forEach((p: any) => tierCounts[p.tier as keyof typeof tierCounts]++);
    
    const usedCodes = codes.filter((c: any) => c.used).length;
    const unusedCodes = codes.filter((c: any) => !c.used).length;
    
    const prices = { basic: 50, standard: 150, gold: 350, enterprise: 600 };
    const estimatedRevenue = Object.entries(tierCounts).reduce((total, [tier, count]) => {
      return total + (count * (prices[tier as keyof typeof prices] || 0));
    }, 0);
    
    const embed = new EmbedBuilder()
      .setTitle('💎 Premium Statistics')
      .setColor('#ffd700')
      .addFields(
        { name: 'Total Premium Servers', value: premiums.length.toString(), inline: true },
        { name: 'Total Codes Generated', value: codes.length.toString(), inline: true },
        { name: 'Used Codes', value: usedCodes.toString(), inline: true },
        { name: 'Unused Codes', value: unusedCodes.toString(), inline: true },
        { name: 'Basic', value: tierCounts.basic.toString(), inline: true },
        { name: 'Standard', value: tierCounts.standard.toString(), inline: true },
        { name: 'Gold', value: tierCounts.gold.toString(), inline: true },
        { name: 'Enterprise', value: tierCounts.enterprise.toString(), inline: true },
        { name: 'Estimated Revenue', value: `₱${estimatedRevenue.toLocaleString()}`, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
