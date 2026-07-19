import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('screenshot')
        .setDescription('Take a screenshot of a website')
        .addStringOption(option => option.setName('url')
        .setDescription('Website URL')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const url = interaction.options.getString('url', true);
        await interaction.reply({ content: `📸 Screenshot of ${url}: [Placeholder image]`, ephemeral: true });
    },
};
//# sourceMappingURL=screenshot.js.map