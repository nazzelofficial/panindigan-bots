import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('typerace')
        .setDescription('Start a type race game'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '⌨️ Type race game started! Type the given text as fast as you can.', ephemeral: true });
    },
};
//# sourceMappingURL=typerace.js.map