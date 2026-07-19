import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('language_view')
        .setDescription('View the default language'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const language = system?.defaultLanguage || 'en';
        const embed = new EmbedBuilder()
            .setTitle('🌐 Default Language')
            .setColor('#00ff00')
            .addFields({ name: 'Language Code', value: language.toUpperCase(), inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=languageView.js.map