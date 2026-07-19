import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
export default {
    data: new SlashCommandBuilder()
        .setName('owner_permissions_set')
        .setDescription('Set specific permissions for a co-owner')
        .addStringOption(option => option.setName('user_id')
        .setDescription('User ID')
        .setRequired(true))
        .addStringOption(option => option.setName('permission')
        .setDescription('Permission to grant')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const permission = interaction.options.getString('permission', true);
        const system = await SystemModel.findOne({});
        const coOwnerPerms = system?.coOwnerPermissions || {};
        coOwnerPerms[userId] = coOwnerPerms[userId] || [];
        coOwnerPerms[userId].push(permission);
        await SystemModel.findOneAndUpdate({}, { coOwnerPermissions: coOwnerPerms }, { upsert: true });
        await interaction.reply({ content: `✅ Added permission "${permission}" to ${userId}`, ephemeral: true });
    },
};
//# sourceMappingURL=ownerPermissionsSet.js.map