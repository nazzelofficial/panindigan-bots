import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
import { clientRegistry } from '../../structures/clientRegistry';
export default {
    data: new SlashCommandBuilder()
        .setName('owner_list')
        .setDescription('List all owners and co-owners'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const system = await SystemModel.findOne({});
        const coOwners = system?.coOwners || [];
        const ownerId = process.env.BOT_OWNER_ID;
        const client = clientRegistry.get();
        const embed = new EmbedBuilder()
            .setTitle('👑 Bot Owners')
            .setColor('#ffd700')
            .addFields({ name: 'Primary Owner', value: ownerId || 'Unknown', inline: true }, { name: 'Co-Owners', value: coOwners.length > 0 ? coOwners.join('\n') : 'None', inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=ownerList.js.map