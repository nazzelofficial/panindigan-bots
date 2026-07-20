import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('stopwatch')
        .setDescription('Start a stopwatch'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        await interaction.reply({ content: '⏱️ Stopwatch started! Use `/stopwatch_stop` to stop it.', ephemeral: true });
    },
};
//# sourceMappingURL=stopwatch.js.map