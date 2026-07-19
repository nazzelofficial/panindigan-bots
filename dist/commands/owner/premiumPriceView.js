import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('premium_price_view')
        .setDescription('View current Premium prices'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const prices = system?.premiumPrices || {
            basic: 50,
            standard: 150,
            gold: 350,
            enterprise: 600,
            '3-server': 499,
            '5-server': 799,
            '10-server': 1199
        };
        const embed = new EmbedBuilder()
            .setTitle('💰 Premium Prices')
            .setColor('#ffd700')
            .addFields({ name: 'Single-Server Plans', value: '━━━━━━━━━━━━━━━━', inline: false }, { name: 'Basic', value: `₱${prices.basic}`, inline: true }, { name: 'Standard', value: `₱${prices.standard}`, inline: true }, { name: 'Gold', value: `₱${prices.gold}`, inline: true }, { name: 'Enterprise', value: `₱${prices.enterprise}`, inline: true }, { name: 'Server Packs', value: '━━━━━━━━━━━━━━━━', inline: false }, { name: '3-Server Pack', value: `₱${prices['3-server']}`, inline: true }, { name: '5-Server Pack', value: `₱${prices['5-server']}`, inline: true }, { name: '10-Server Pack', value: `₱${prices['10-server']}`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=premiumPriceView.js.map