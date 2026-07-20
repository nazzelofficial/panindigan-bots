import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate something')
        .addStringOption(option => option.setName('thing')
        .setDescription('Thing to rate')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const thing = interaction.options.getString('thing', true);
        const rating = Math.floor(Math.random() * 10) + 1;
        const embed = new EmbedBuilder()
            .setTitle('⭐ Rate')
            .setColor('#ffcc00')
            .setDescription(`I rate ${thing} ${rating}/10`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=rate.js.map