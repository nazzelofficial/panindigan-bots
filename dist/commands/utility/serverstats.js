import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('View server statistics'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const guild = interaction.guild;
        const embed = new EmbedBuilder()
            .setTitle('📊 Server Statistics')
            .setColor('#00ff00')
            .addFields({ name: 'Members', value: `${guild?.memberCount || 0}`, inline: true }, { name: 'Channels', value: `${guild?.channels.cache.size || 0}`, inline: true }, { name: 'Roles', value: `${guild?.roles.cache.size || 0}`, inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=serverstats.js.map