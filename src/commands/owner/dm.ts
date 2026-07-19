import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('DM a user using the bot')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to DM')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to send')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    const message = interaction.options.getString('message', true);
    const client = clientRegistry.get()!;
    
    try {
      const user = await client.users.fetch(userId);
      await user.send(message);
      await interaction.reply({ content: `✅ DM sent to ${user.tag}`, ephemeral: true });
    } catch (error: any) {
      await interaction.reply({ content: `❌ Failed to send DM: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
