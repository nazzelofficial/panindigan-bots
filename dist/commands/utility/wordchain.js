import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('wordchain')
        .setDescription('Start a word chain game'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '🔗 Word chain game started! Say a word that starts with the last letter of the previous word.', ephemeral: true });
    },
};
//# sourceMappingURL=wordchain.js.map