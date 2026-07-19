import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('webhook_create')
    .setDescription('Create a webhook in a channel')
    .addStringOption(option =>
      option.setName('channel_id')
        .setDescription('Channel ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Webhook name')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const channelId = interaction.options.getString('channel_id', true);
    const name = interaction.options.getString('name', true);
    
    const channel = await interaction.client.channels.fetch(channelId);
    
    if (!channel || !('createWebhook' in channel)) {
      return interaction.reply({ content: '❌ Invalid channel or cannot create webhook', ephemeral: true });
    }
    
    try {
      const webhook = await channel.createWebhook({ name });
      await interaction.reply({ 
        content: `✅ Created webhook: ${webhook.url}`, 
        ephemeral: true 
      });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to create webhook: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
