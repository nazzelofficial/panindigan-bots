import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('serverboostinfo')
        .setDescription('View server boost information'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const guild = interaction.guild;
        const premiumTier = guild?.premiumTier || 0;
        const premiumSubscriptions = guild?.premiumSubscriptionCount || 0;
        const embed = new EmbedBuilder()
            .setTitle('⚡ Server Boost Info')
            .setColor('#00ff00')
            .addFields({ name: 'Boost Level', value: `Level ${premiumTier}`, inline: true }, { name: 'Total Boosts', value: premiumSubscriptions.toString(), inline: true }, { name: 'Next Level', value: premiumTier < 3 ? `${(2 ** premiumTier) * 2 - premiumSubscriptions} more needed` : 'Max level', inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=serverboostinfo.js.map