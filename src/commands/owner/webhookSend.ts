import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('webhook_send')
    .setDescription('Send a message via webhook')
    .addStringOption(option =>
      option.setName('webhook_url')
        .setDescription('Webhook URL')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to send')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const webhookUrl = interaction.options.getString('webhook_url', true);
    const message = interaction.options.getString('message', true);
    
    try {
      const webhook = await interaction.client.fetchWebhook(webhookUrl);
      await webhook.send(message);
      await interaction.reply({ content: '✅ Message sent via webhook', ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to send message: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
