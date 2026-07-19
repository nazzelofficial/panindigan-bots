import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('snakegame')
        .setDescription('Play Snake'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '🐍 Snake game started!', ephemeral: true });
    },
};
//# sourceMappingURL=snakegame.js.map