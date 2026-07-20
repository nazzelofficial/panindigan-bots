import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('joinserver')
    .setDescription('Make the bot join a server using an invite link')
    .addStringOption(option =>
      option.setName('invite_link')
        .setDescription('Invite link to join')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const inviteLink = interaction.options.getString('invite_link', true);
    
    await interaction.reply({ content: '🚶 Attempting to join server...', ephemeral: true });
    
    try {
      const code = inviteLink.match(/discord\.gg\/([a-zA-Z0-9]+)/)?.[1] || inviteLink.match(/discord\.com\/invite\/([a-zA-Z0-9]+)/)?.[1];
      
      if (!code) {
        return interaction.followUp({ content: '❌ Invalid invite link format', ephemeral: true });
      }
      
      await interaction.followUp({ 
        content: '⚠️ Auto-join via invite links is disabled for security. Please use the standard invite flow.', 
        ephemeral: true 
      });
    } catch (error: any) {
      await interaction.followUp({ content: `❌ Failed to join server: ${error.message}`, ephemeral: true });
    }
  },
} as unknown as CommandDefinition;
