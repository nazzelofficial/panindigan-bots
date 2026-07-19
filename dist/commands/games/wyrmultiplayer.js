import { baseEmbed } from '../../utils/embeds';
const command = {
    name: 'wyrmultiplayer',
    description: 'Play Would You Rather with multiple players',
    category: 'Games',
    access: 'general',
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b
        .addUserOption(option => option.setName('player1')
        .setDescription('First player')
        .setRequired(true))
        .addUserOption(option => option.setName('player2')
        .setDescription('Second player')
        .setRequired(false)),
    async execute(ctx) {
        const player1 = ctx.isSlash ? ctx.interaction.options.getUser('player1', true) : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, '') ?? '').catch(() => null);
        const player2 = ctx.isSlash ? ctx.interaction.options.getUser('player2') : ctx.args[1] ? await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, '') ?? '').catch(() => null) : null;
        if (!player1) {
            await ctx.reply({ content: 'Invalid player1.' });
            return;
        }
        const questions = [
            'Would you rather have the ability to fly or be invisible?',
            'Would you rather never use social media again or never watch a movie again?',
            'Would you rather be famous or rich?',
        ];
        const question = questions[Math.floor(Math.random() * questions.length)];
        const embed = baseEmbed('primary')
            .setTitle('🤔 Would You Rather — Multiplayer')
            .setDescription(question)
            .addFields({ name: 'Player 1', value: `<@${player1.id}>`, inline: true }, { name: 'Player 2', value: player2 ? `<@${player2.id}>` : 'Anyone', inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=wyrmultiplayer.js.map