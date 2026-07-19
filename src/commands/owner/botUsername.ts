import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('bot_username')
    .setDescription('Change the bot username')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('New username')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(32)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString('username', true);
    
    await interaction.reply({ content: '📝 Changing bot username...', ephemeral: true });
    
    try {
      await interaction.client.user.setUsername(username);
      await interaction.followUp({ content: `✅ Bot username updated to ${username}`, ephemeral: true });
    } catch (error: any) {
      await interaction.followUp({ content: `❌ Failed to update username: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
