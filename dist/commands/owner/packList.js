import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium';
export default {
    data: new SlashCommandBuilder()
        .setName('pack_list')
        .setDescription('List all active Server Packs'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const premiums = await PremiumModel.find({ packId: { $exists: true } });
        if (premiums.length === 0) {
            return interaction.reply({ content: '❌ No Server Packs found', ephemeral: true });
        }
        const packMap = new Map();
        premiums.forEach((p) => {
            if (!packMap.has(p.packId)) {
                packMap.set(p.packId, []);
            }
            packMap.get(p.packId).push(p);
        });
        const embed = new EmbedBuilder()
            .setTitle('📦 Active Server Packs')
            .setColor('#ffd700')
            .setDescription(Array.from(packMap.entries()).map(([packId, servers]) => `**Pack ID: ${packId}** - ${servers.length} servers\n${servers.map((s) => s.guildId).join(', ')}`).join('\n\n'))
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=packList.js.map