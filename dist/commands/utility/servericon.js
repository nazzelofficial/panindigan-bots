import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('View the server icon'),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const guild = interaction.guild;
        const icon = guild?.iconURL();
        const embed = new EmbedBuilder()
            .setTitle('🖼️ Server Icon')
            .setColor('#00ff00')
            .setThumbnail(icon || null)
            .setDescription(icon ? 'Server icon' : 'No icon set')
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=servericon.js.map