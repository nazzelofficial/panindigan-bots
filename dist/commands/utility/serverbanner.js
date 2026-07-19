import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('serverbanner')
        .setDescription('View the server banner'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const guild = interaction.guild;
        const banner = guild?.bannerURL();
        const embed = new EmbedBuilder()
            .setTitle('🖼️ Server Banner')
            .setColor('#00ff00')
            .setImage(banner || null)
            .setDescription(banner ? 'Server banner' : 'No banner set')
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=serverbanner.js.map