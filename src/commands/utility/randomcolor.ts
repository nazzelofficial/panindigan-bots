import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('randomcolor')
    .setDescription('Generate a random color'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const color = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    
    const embed = new EmbedBuilder()
      .setTitle('🎨 Random Color')
      .setColor(`#${color}`)
      .setDescription(`#${color}`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
