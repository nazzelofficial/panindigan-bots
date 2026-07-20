import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('bot_username')
        .setDescription('Change the bot username')
        .addStringOption(option => option.setName('username')
        .setDescription('New username')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(32)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const username = interaction.options.getString('username', true);
        await interaction.reply({ content: '📝 Changing bot username...', ephemeral: true });
        try {
            await interaction.client.user.setUsername(username);
            await interaction.followUp({ content: `✅ Bot username updated to ${username}`, ephemeral: true });
        }
        catch (error) {
            await interaction.followUp({ content: `❌ Failed to update username: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=botUsername.js.map