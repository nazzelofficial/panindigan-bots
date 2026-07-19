import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('View the server icon'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    const icon = guild?.iconURL();
    
    const embed = new EmbedBuilder()
      .setTitle('🖼️ Server Icon')
      .setColor('#00ff00')
      .setThumbnail(icon || null)
      .setDescription(icon ? 'Server icon' : 'No icon set')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
