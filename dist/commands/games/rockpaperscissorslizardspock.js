import { EmbedBuilder } from 'discord.js';
const EMOJIS = {
    rock: '🪨', paper: '📄', scissors: '✂️', lizard: '🦎', spock: '🖖',
};
// beats[A][B] = the action string (A beats B with this action)
const BEATS = {
    rock: { scissors: 'crushes', lizard: 'crushes' },
    paper: { rock: 'covers', spock: 'disproves' },
    scissors: { paper: 'cuts', lizard: 'decapitates' },
    lizard: { spock: 'poisons', paper: 'eats' },
    spock: { scissors: 'smashes', rock: 'vaporizes' },
};
const CHOICES = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
const command = {
    name: 'rpsls',
    description: 'Play Rock, Paper, Scissors, Lizard, Spock!',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 3,
    slashData: (b) => b
        .addStringOption(o => o.setName('choice').setDescription('Your move').setRequired(true)
        .addChoices({ name: '🪨 Rock', value: 'rock' }, { name: '📄 Paper', value: 'paper' }, { name: '✂️ Scissors', value: 'scissors' }, { name: '🦎 Lizard', value: 'lizard' }, { name: '🖖 Spock', value: 'spock' })),
    async execute(ctx) {
        const player = ctx.isSlash ? ctx.interaction.options.getString('choice', true) : ctx.args[0]?.toLowerCase();
        const bot = CHOICES[Math.floor(Math.random() * CHOICES.length)];
        if (!player || !CHOICES.includes(player)) {
            await ctx.reply({ content: 'Invalid choice. Use: rock, paper, scissors, lizard, or spock.' });
            return;
        }
        let result;
        let actionText;
        let color;
        let title;
        if (player === bot) {
            result = 'tie';
            actionText = "It's the same! Great minds think alike.";
            color = 0xFFAA00;
            title = "🤝 It's a Tie!";
        }
        else if (BEATS[player]?.[bot]) {
            result = 'win';
            actionText = `${EMOJIS[player]} **${player}** ${BEATS[player][bot]} ${EMOJIS[bot]} **${bot}**!`;
            color = 0x00C851;
            title = '🎉 You Win!';
        }
        else {
            result = 'lose';
            actionText = `${EMOJIS[bot]} **${bot}** ${BEATS[bot][player]} ${EMOJIS[player]} **${player}**!`;
            color = 0xFF4444;
            title = '❌ You Lose!';
        }
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .addFields({ name: '🎮 You chose', value: `${EMOJIS[player]} ${player}`, inline: true }, { name: '🤖 Bot chose', value: `${EMOJIS[bot]} ${bot}`, inline: true }, { name: '⚡ Action', value: actionText, inline: false })
            .setFooter({ text: 'Rock • Paper • Scissors • Lizard • Spock' })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=rockpaperscissorslizardspock.js.map