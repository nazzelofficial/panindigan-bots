import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Get the current time'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const time = new Date().toLocaleTimeString();
        await interaction.reply({ content: `🕐 Current time: ${time}`, ephemeral: true });
    },
};
//# sourceMappingURL=time.js.map