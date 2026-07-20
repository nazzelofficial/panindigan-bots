import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('sticker')
        .setDescription('View sticker information')
        .addStringOption(option => option.setName('name')
        .setDescription('Sticker name')
        .setRequired(true)),
    category: 'Utility',
    accessTier: 'user',
    async execute(interaction) {
        const name = interaction.options.getString('name', true);
        const embed = new EmbedBuilder()
            .setTitle('🏷️ Sticker Info')
            .setColor('#00ff00')
            .setDescription(`Sticker: ${name}`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=sticker.js.map