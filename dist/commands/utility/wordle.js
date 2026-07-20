import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('utilitywordle')
        .setDescription('Play Wordle'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '🎮 Wordle game started! Guess a 5-letter word.', ephemeral: true });
    },
};
//# sourceMappingURL=wordle.js.map