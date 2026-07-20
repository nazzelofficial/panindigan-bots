import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get a random quote'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const quotes = [
            { text: 'Be the change you want to see in the world.', author: 'Mahatma Gandhi' },
            { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
            { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        const embed = new EmbedBuilder()
            .setTitle('💬 Random Quote')
            .setColor('#00ff00')
            .setDescription(`"${quote.text}"`)
            .setFooter({ text: `- ${quote.author}` })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=quote.js.map