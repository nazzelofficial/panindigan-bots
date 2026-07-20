import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('randomemoji')
        .setDescription('Get a random emoji'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const emojis = ['😀', '😂', '😍', '🥳', '🎉', '🔥', '❤️', '💯', '✨', '🚀'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        await interaction.reply({ content: emoji, ephemeral: true });
    },
};
//# sourceMappingURL=randomemoji.js.map