import { EmbedBuilder } from 'discord.js';
// Pre-generated Sudoku puzzles (0 = empty cell)
const PUZZLES = [
    {
        difficulty: 'Easy',
        grid: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ],
        solution: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ],
    },
    {
        difficulty: 'Medium',
        grid: [
            [0, 0, 0, 2, 6, 0, 7, 0, 1],
            [6, 8, 0, 0, 7, 0, 0, 9, 0],
            [1, 9, 0, 0, 0, 4, 5, 0, 0],
            [8, 2, 0, 1, 0, 0, 0, 4, 0],
            [0, 0, 4, 6, 0, 2, 9, 0, 0],
            [0, 5, 0, 0, 0, 3, 0, 2, 8],
            [0, 0, 9, 3, 0, 0, 0, 7, 4],
            [0, 4, 0, 0, 5, 0, 0, 3, 6],
            [7, 0, 3, 0, 1, 8, 0, 0, 0],
        ],
        solution: [
            [4, 3, 5, 2, 6, 9, 7, 8, 1],
            [6, 8, 2, 5, 7, 1, 4, 9, 3],
            [1, 9, 7, 8, 3, 4, 5, 6, 2],
            [8, 2, 6, 1, 9, 5, 3, 4, 7],
            [3, 7, 4, 6, 8, 2, 9, 1, 5],
            [9, 5, 1, 7, 4, 3, 6, 2, 8],
            [5, 1, 9, 3, 2, 6, 8, 7, 4],
            [2, 4, 8, 9, 5, 7, 1, 3, 6],
            [7, 6, 3, 4, 1, 8, 2, 5, 9],
        ],
    },
    {
        difficulty: 'Hard',
        grid: [
            [0, 0, 0, 6, 0, 0, 4, 0, 0],
            [7, 0, 0, 0, 0, 3, 6, 0, 0],
            [0, 0, 0, 0, 9, 1, 0, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 5, 0, 1, 8, 0, 0, 0, 3],
            [0, 0, 0, 3, 0, 6, 0, 4, 5],
            [0, 4, 0, 2, 0, 0, 0, 6, 0],
            [9, 0, 3, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 0, 0, 1, 0, 0],
        ],
        solution: [
            [5, 8, 1, 6, 7, 2, 4, 3, 9],
            [7, 9, 2, 8, 4, 3, 6, 5, 1],
            [3, 6, 4, 5, 9, 1, 7, 8, 2],
            [4, 3, 8, 9, 5, 7, 2, 1, 6],
            [2, 5, 6, 1, 8, 4, 9, 7, 3],
            [1, 7, 9, 3, 2, 6, 8, 4, 5],
            [8, 4, 5, 2, 1, 9, 3, 6, 7],
            [9, 1, 3, 7, 6, 8, 5, 2, 4],
            [6, 2, 7, 4, 3, 5, 1, 9, 8],
        ],
    },
];
function formatGrid(grid) {
    const rows = grid.map((row, ri) => {
        const cells = row.map((n, ci) => {
            const val = n === 0 ? '·' : n.toString();
            return ci === 2 || ci === 5 ? val + ' │' : val;
        }).join(' ');
        return ri === 2 || ri === 5 ? cells + '\n' + '──────┼───────┼──────' : cells;
    });
    return '```\n' + rows.join('\n') + '\n```';
}
const command = {
    name: 'sudoku',
    description: 'Get a Sudoku puzzle to solve! (· = empty cell)',
    category: 'Games',
    access: 'general',
    guildOnly: false,
    cooldown: 10,
    slashData: (b) => b
        .addStringOption(o => o.setName('difficulty').setDescription('Puzzle difficulty').setRequired(false)
        .addChoices({ name: 'Easy', value: 'Easy' }, { name: 'Medium', value: 'Medium' }, { name: 'Hard', value: 'Hard' })),
    async execute(ctx) {
        const difficulty = ctx.isSlash ? ctx.interaction.options.getString('difficulty') ?? 'Easy' : ctx.args[0] ?? 'Easy';
        const puzzle = PUZZLES.find(p => p.difficulty === difficulty) ?? PUZZLES[0];
        const empty = puzzle.grid.flat().filter(n => n === 0).length;
        const embed = new EmbedBuilder()
            .setTitle(`🔢 Sudoku — ${puzzle.difficulty}`)
            .setColor(difficulty === 'Easy' ? 0x00C851 : difficulty === 'Medium' ? 0xFFAA00 : 0xFF4444)
            .setDescription(formatGrid(puzzle.grid))
            .addFields({ name: '📊 Difficulty', value: puzzle.difficulty, inline: true }, { name: '❓ Empty Cells', value: `${empty}`, inline: true })
            .setFooter({ text: 'Fill in each row, column, and 3×3 box with the digits 1–9.' })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=sudoku.js.map