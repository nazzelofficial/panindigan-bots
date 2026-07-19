import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('globalbans')
        .setDescription('List all globally banned users'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const globalBans = system?.globalBans || [];
        if (globalBans.length === 0) {
            return interaction.reply({ content: '❌ No globally banned users', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setTitle('🚫 Globally Banned Users')
            .setColor('#ff0000')
            .setDescription(globalBans.join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=globalbans.js.map