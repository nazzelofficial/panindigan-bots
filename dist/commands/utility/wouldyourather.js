import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('wouldyourather')
        .setDescription('Play Would You Rather'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const questions = [
            'Would you rather have the ability to fly or be invisible?',
            'Would you rather never use social media again or never watch a movie again?',
            'Would you rather be famous or rich?',
        ];
        const question = questions[Math.floor(Math.random() * questions.length)];
        const embed = new EmbedBuilder()
            .setTitle('🤔 Would You Rather')
            .setColor('#00ff00')
            .setDescription(question)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=wouldyourather.js.map