import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('year')
        .setDescription('Get the current year'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const year = new Date().getFullYear();
        await interaction.reply({ content: `📅 Current year: ${year}`, ephemeral: true });
    },
};
//# sourceMappingURL=year.js.map