import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('wikipedia')
        .setDescription('Search Wikipedia')
        .addStringOption(option => option.setName('query')
        .setDescription('Search query')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const query = interaction.options.getString('query', true);
        const embed = new EmbedBuilder()
            .setTitle('📚 Wikipedia Search')
            .setColor('#00ff00')
            .setDescription(`Search results for: ${query}`)
            .addFields({ name: 'Result', value: '[Placeholder result]', inline: false })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=wikipedia.js.map