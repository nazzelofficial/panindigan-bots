import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('uno')
        .setDescription('Play UNO')
        .addUserOption(option => option.setName('opponent')
        .setDescription('Opponent')
        .setRequired(false)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '🃏 UNO game started!', ephemeral: true });
    },
};
//# sourceMappingURL=uno.js.map