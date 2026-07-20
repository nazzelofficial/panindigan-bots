import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sayembed')
    .setDescription('Say a message in an embed')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to say')
        .setRequired(true)),
  category: 'Utility',
  accessTier: 'admin',
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    
    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor('#00ff00')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
} as unknown as CommandDefinition;
