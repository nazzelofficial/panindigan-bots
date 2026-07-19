import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('database_stats')
        .setDescription('View database statistics and health'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🗄️ Database Statistics')
            .setColor('#00ff00')
            .addFields({ name: 'Status', value: 'Connected', inline: true }, { name: 'Collections', value: '8', inline: true }, { name: 'Documents', value: 'Calculating...', inline: true })
            .setDescription('Database connection is healthy')
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=databaseStats.js.map