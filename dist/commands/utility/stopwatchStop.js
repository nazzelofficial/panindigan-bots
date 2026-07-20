import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('stopwatch_stop')
        .setDescription('Stop the stopwatch'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '⏱️ Stopwatch stopped!', ephemeral: true });
    },
};
//# sourceMappingURL=stopwatchStop.js.map