import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('quiz')
        .setDescription('Start a quiz'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('❓ Quiz')
            .setColor('#00ff00')
            .setDescription('What is the capital of Japan?')
            .addFields({ name: 'A', value: 'Seoul', inline: true }, { name: 'B', value: 'Tokyo', inline: true }, { name: 'C', value: 'Beijing', inline: true }, { name: 'D', value: 'Bangkok', inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=quiz.js.map