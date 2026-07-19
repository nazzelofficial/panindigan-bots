import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Reverse text')
        .addStringOption(option => option.setName('text')
        .setDescription('Text to reverse')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const text = interaction.options.getString('text', true);
        const reversed = text.split('').reverse().join('');
        await interaction.reply({ content: `🔄 Reversed: ${reversed}`, ephemeral: true });
    },
};
//# sourceMappingURL=reverse.js.map