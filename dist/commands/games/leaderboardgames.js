import { EmbedBuilder } from 'discord.js';
const command = {
    name: 'leaderboardgames',
    description: 'View the games leaderboard',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b,
    async execute(ctx) {
        const embed = new EmbedBuilder()
            .setTitle('🏆 Games Leaderboard')
            .setColor('#ffcc00')
            .setDescription('Top players across all games')
            .addFields({ name: '1. Player1', value: '1000 points', inline: true }, { name: '2. Player2', value: '850 points', inline: true }, { name: '3. Player3', value: '700 points', inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=leaderboardgames.js.map