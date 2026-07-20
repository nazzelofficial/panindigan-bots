import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('votereminder')
        .setDescription('Set a vote reminder'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '✅ Vote reminder set! You will be reminded to vote for the bot.', ephemeral: true });
    },
};
//# sourceMappingURL=votereminder.js.map