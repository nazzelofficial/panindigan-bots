import { SlashCommandBuilder } from 'discord.js';
import { SystemModel } from '../../database/models/System';
import { clientRegistry } from '../../structures/clientRegistry';
export default {
    data: new SlashCommandBuilder()
        .setName('globalban')
        .setDescription('Globally ban a user from all bot servers')
        .addStringOption(option => option.setName('user_id')
        .setDescription('User ID to ban')
        .setRequired(true))
        .addStringOption(option => option.setName('reason')
        .setDescription('Reason for ban')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const userId = interaction.options.getString('user_id', true);
        const reason = interaction.options.getString('reason', true);
        const client = clientRegistry.get();
        const system = await SystemModel.findOne({});
        const globalBans = system?.globalBans || [];
        if (globalBans.includes(userId)) {
            return interaction.reply({ content: '❌ User is already globally banned', ephemeral: true });
        }
        globalBans.push(userId);
        await SystemModel.findOneAndUpdate({}, { globalBans }, { upsert: true });
        let banCount = 0;
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.bans.create(userId, { reason });
                banCount++;
            }
            catch (error) {
                // Skip if already banned or no permission
            }
        }
        await interaction.reply({
            content: `✅ Globally banned ${userId}. Banned from ${banCount} servers.`,
            ephemeral: true
        });
    },
};
//# sourceMappingURL=globalban.js.map