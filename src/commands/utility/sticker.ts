import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stickerinfo')
    .setDescription('View sticker information')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Sticker name')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    
    const embed = new EmbedBuilder()
      .setTitle('🏷️ Sticker Info')
      .setColor('#00ff00')
      .setDescription(`Sticker: ${name}`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
