import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium';
import { clientRegistry } from '../../structures/clientRegistry';
export default {
    data: new SlashCommandBuilder()
        .setName('pack_info')
        .setDescription('View details of a specific Server Pack')
        .addStringOption(option => option.setName('pack_id')
        .setDescription('Pack ID')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const packId = interaction.options.getString('pack_id', true);
        const premiums = await PremiumModel.find({ packId });
        if (premiums.length === 0) {
            return interaction.reply({ content: '❌ Pack not found', ephemeral: true });
        }
        const client = clientRegistry.get();
        const serverNames = await Promise.all(premiums.map(async (p) => {
            const guild = client.guilds.cache.get(p.guildId);
            return guild ? guild.name : p.guildId;
        }));
        const embed = new EmbedBuilder()
            .setTitle(`📦 Server Pack: ${packId}`)
            .setColor('#ffd700')
            .addFields({ name: 'Servers Count', value: premiums.length.toString(), inline: true }, { name: 'Tier', value: 'Enterprise', inline: true }, { name: 'Created At', value: premiums[0].grantedAt?.toLocaleDateString() || 'Unknown', inline: true })
            .setDescription(serverNames.join('\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=packInfo.js.map