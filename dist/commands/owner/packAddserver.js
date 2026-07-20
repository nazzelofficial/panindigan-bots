import { SlashCommandBuilder } from 'discord.js';
import { PremiumModel } from '../../database/models/Premium.js';
export default {
    data: new SlashCommandBuilder()
        .setName('pack_addserver')
        .setDescription('Add a server to an existing pack')
        .addStringOption(option => option.setName('pack_id')
        .setDescription('Pack ID')
        .setRequired(true))
        .addStringOption(option => option.setName('server_id')
        .setDescription('Server ID to add')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const packId = interaction.options.getString('pack_id', true);
        const serverId = interaction.options.getString('server_id', true);
        await PremiumModel.findOneAndUpdate({ guildId: serverId }, {
            guildId: serverId,
            tier: 'enterprise',
            packId,
            grantedAt: new Date(),
            grantedBy: interaction.user.id,
            history: [{
                    date: new Date(),
                    action: 'grant',
                    tier: 'enterprise',
                    by: interaction.user.id
                }]
        }, { upsert: true });
        await interaction.reply({
            content: `✅ Added server ${serverId} to pack ${packId}`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=packAddserver.js.map