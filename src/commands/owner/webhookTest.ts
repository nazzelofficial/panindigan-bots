import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { WebhookModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('webhook_test')
    .setDescription('Send a test event payload to a registered webhook')
    .addStringOption(o =>
      o.setName('id').setDescription('Webhook MongoDB ID').setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getString('id', true);
    await interaction.deferReply({ ephemeral: true });

    const webhook = await WebhookModel.findById(id).lean() as any;

    if (!webhook) {
      return interaction.editReply({ content: `❌ Webhook with ID \`${id}\` not found.` });
    }

    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      source: 'Panindigan Official',
      data: {
        message: 'This is a test event from the bot owner.',
        webhookId: id,
        triggeredBy: interaction.user.tag,
      },
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Panindigan-Official/1.0' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        return interaction.editReply({
          content: `✅ Test event sent to webhook \`${id}\`.\nHTTP \`${response.status} ${response.statusText}\``,
        });
      }
      return interaction.editReply({
        content: `⚠️ Webhook responded with HTTP \`${response.status} ${response.statusText}\`. The endpoint may not be accepting events correctly.`,
      });
    } catch (error: any) {
      return interaction.editReply({ content: `❌ Failed to reach webhook: ${error.message}` });
    }
  },
};
