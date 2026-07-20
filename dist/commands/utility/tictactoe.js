import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('utilitytictactoe')
        .setDescription('Play Tic Tac Toe')
        .addUserOption(option => option.setName('opponent')
        .setDescription('Opponent')
        .setRequired(false)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '🎮 Tic Tac Toe game started!', ephemeral: true });
    },
};
//# sourceMappingURL=tictactoe.js.map