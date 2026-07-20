import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('verify_panel')
        .setDescription('Create a verification panel')
        .addStringOption(option => option.setName('title')
        .setDescription('Panel title')
        .setRequired(true))
        .addStringOption(option => option.setName('description')
        .setDescription('Panel description')
        .setRequired(true)),
    category: 'Verification',
    accessTier: 'admin',
    async execute(interaction) {
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description', true);
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#00ff00')
            .setTimestamp();
        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success));
        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Verification panel created', ephemeral: true });
    },
};
//# sourceMappingURL=verifyPanel.js.map