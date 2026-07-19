import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('rate')
    .setDescription('Rate something')
    .addStringOption(option =>
      option.setName('thing')
        .setDescription('Thing to rate')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const thing = interaction.options.getString('thing', true);
    const rating = Math.floor(Math.random() * 10) + 1;
    
    const embed = new EmbedBuilder()
      .setTitle('⭐ Rate')
      .setColor('#ffcc00')
      .setDescription(`I rate ${thing} ${rating}/10`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
