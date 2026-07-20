import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium.js';
export default {
    data: new SlashCommandBuilder()
        .setName('premium_codes')
        .setDescription('List all generated and unused Premium codes'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const codes = await PremiumModel.find({ used: false });
        if (codes.length === 0) {
            return interaction.reply({ content: '❌ No unused Premium codes found', ephemeral: true });
        }
        const tierCounts = { basic: 0, standard: 0, gold: 0, enterprise: 0 };
        codes.forEach((c) => tierCounts[c.tier]++);
        const embed = new EmbedBuilder()
            .setTitle('💎 Unused Premium Codes')
            .setColor('#ffd700')
            .addFields({ name: 'Total Unused Codes', value: codes.length.toString(), inline: true }, { name: 'Basic', value: tierCounts.basic.toString(), inline: true }, { name: 'Standard', value: tierCounts.standard.toString(), inline: true }, { name: 'Gold', value: tierCounts.gold.toString(), inline: true }, { name: 'Enterprise', value: tierCounts.enterprise.toString(), inline: true })
            .setDescription(codes.slice(0, 25).map((c) => `${c.code} - ${c.tier.toUpperCase()} (Created: ${c.createdAt?.toLocaleDateString()})`).join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=premiumCodes.js.map