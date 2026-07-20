import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { WebhookModel } from '../../database/models/System.js';
export default {
    data: new SlashCommandBuilder()
        .setName('webhook_list')
        .setDescription('List all registered webhook endpoints'),
    category: 'Owner',
    accessTier: 'owner',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const webhooks = await WebhookModel.find({}).lean();
        if (webhooks.length === 0) {
            return interaction.editReply({ content: 'ℹ️ No webhooks registered. Use `/webhook_create` to add one.' });
        }
        const lines = webhooks.map((w, i) => `\`${i + 1}.\` **ID:** \`${w._id}\`\n  URL: \`${String(w.url).slice(0, 60)}${String(w.url).length > 60 ? '...' : ''}\`\n  Events: ${(w.events?.length ? w.events : ['all']).join(', ')}\n  Server: \`${w.guildId ?? 'global'}\` — Created <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>`);
        const embed = new EmbedBuilder()
            .setTitle('🔗 Registered Webhooks')
            .setColor('#5865F2')
            .setDescription(lines.join('\n\n').slice(0, 4000))
            .setFooter({ text: `${webhooks.length} webhook(s) registered` })
            .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=webhookList.js.map