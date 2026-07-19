import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium';
export default {
    data: new SlashCommandBuilder()
        .setName('premium_stats')
        .setDescription('View complete Premium statistics'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const premiums = await PremiumModel.find({});
        const codes = await PremiumModel.find({ code: { $exists: true } });
        const tierCounts = { basic: 0, standard: 0, gold: 0, enterprise: 0 };
        premiums.forEach((p) => tierCounts[p.tier]++);
        const usedCodes = codes.filter((c) => c.used).length;
        const unusedCodes = codes.filter((c) => !c.used).length;
        const prices = { basic: 50, standard: 150, gold: 350, enterprise: 600 };
        const estimatedRevenue = Object.entries(tierCounts).reduce((total, [tier, count]) => {
            return total + (count * (prices[tier] || 0));
        }, 0);
        const embed = new EmbedBuilder()
            .setTitle('💎 Premium Statistics')
            .setColor('#ffd700')
            .addFields({ name: 'Total Premium Servers', value: premiums.length.toString(), inline: true }, { name: 'Total Codes Generated', value: codes.length.toString(), inline: true }, { name: 'Used Codes', value: usedCodes.toString(), inline: true }, { name: 'Unused Codes', value: unusedCodes.toString(), inline: true }, { name: 'Basic', value: tierCounts.basic.toString(), inline: true }, { name: 'Standard', value: tierCounts.standard.toString(), inline: true }, { name: 'Gold', value: tierCounts.gold.toString(), inline: true }, { name: 'Enterprise', value: tierCounts.enterprise.toString(), inline: true }, { name: 'Estimated Revenue', value: `₱${estimatedRevenue.toLocaleString()}`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=premiumStats.js.map