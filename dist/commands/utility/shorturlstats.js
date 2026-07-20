import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('shorturlstats')
        .setDescription('Get statistics for a short URL')
        .addStringOption(option => option.setName('url')
        .setDescription('Short URL')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const url = interaction.options.getString('url', true);
        const embed = new EmbedBuilder()
            .setTitle('📊 Short URL Stats')
            .setColor('#00ff00')
            .addFields({ name: 'URL', value: url, inline: true }, { name: 'Clicks', value: '0', inline: true }, { name: 'Created', value: 'Unknown', inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=shorturlstats.js.map