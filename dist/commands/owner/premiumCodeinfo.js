import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium';
export default {
    data: new SlashCommandBuilder()
        .setName('premium_codeinfo')
        .setDescription('View information about a Premium code')
        .addStringOption(option => option.setName('code')
        .setDescription('Premium code to check')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const code = interaction.options.getString('code', true);
        const premiumCode = await PremiumModel.findOne({ code: code.toUpperCase() });
        if (!premiumCode) {
            return interaction.reply({ content: '❌ Code not found', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setTitle(`💎 Premium Code Info: ${code}`)
            .setColor('#ffd700')
            .addFields({ name: 'Tier', value: premiumCode.tier.toUpperCase(), inline: true }, { name: 'Status', value: premiumCode.used ? '✅ Used' : '❌ Unused', inline: true }, { name: 'Created At', value: premiumCode.createdAt?.toLocaleString() || 'Unknown', inline: true })
            .setTimestamp();
        if (premiumCode.used && premiumCode.usedBy) {
            embed.addFields({ name: 'Used By', value: premiumCode.usedBy, inline: true }, { name: 'Used At', value: premiumCode.usedAt?.toLocaleString() || 'Unknown', inline: true });
        }
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=premiumCodeinfo.js.map