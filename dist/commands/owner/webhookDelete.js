import { SlashCommandBuilder } from 'discord.js';
export default {
    data: new SlashCommandBuilder()
        .setName('webhook_delete')
        .setDescription('Delete a webhook')
        .addStringOption(option => option.setName('webhook_url')
        .setDescription('Webhook URL')
        .setRequired(true)),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        const webhookUrl = interaction.options.getString('webhook_url', true);
        try {
            const webhook = await interaction.client.fetchWebhook(webhookUrl);
            await webhook.delete();
            await interaction.reply({ content: '✅ Webhook deleted', ephemeral: true });
        }
        catch (error) {
            await interaction.reply({ content: `❌ Failed to delete webhook: ${error.message}`, ephemeral: true });
        }
    },
};
//# sourceMappingURL=webhookDelete.js.map