import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('upper')
        .setDescription('Convert text to uppercase')
        .addStringOption(option => option.setName('text')
        .setDescription('Text to convert')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const text = interaction.options.getString('text', true);
        await interaction.reply({ content: text.toUpperCase(), ephemeral: true });
    },
};
//# sourceMappingURL=upper.js.map