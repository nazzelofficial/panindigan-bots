import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('ticket_stats')
        .setDescription('View ticket statistics'),
    category: 'Tickets',
    accessTier: 'admin',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Ticket Statistics')
            .setColor('#00ff00')
            .addFields({ name: 'Total Tickets', value: '0', inline: true }, { name: 'Open Tickets', value: '0', inline: true }, { name: 'Closed Tickets', value: '0', inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=ticketStats.js.map