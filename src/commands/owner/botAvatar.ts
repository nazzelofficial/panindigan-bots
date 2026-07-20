import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bot_avatar')
    .setDescription('Change the bot avatar')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Image URL')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url', true);
    
    await interaction.reply({ content: '🖼️ Changing bot avatar...', ephemeral: true });
    
    try {
      await interaction.client.user.setAvatar(url);
      await interaction.followUp({ content: '✅ Bot avatar updated', ephemeral: true });
    } catch (error: any) {
      await interaction.followUp({ content: `❌ Failed to update avatar: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
