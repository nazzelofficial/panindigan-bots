import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('utilitytrivia')
    .setDescription('Get a random trivia question'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('❓ Trivia Question')
      .setColor('#00ff00')
      .setDescription('What is the capital of France?')
      .addFields(
        { name: 'A', value: 'London', inline: true },
        { name: 'B', value: 'Paris', inline: true },
        { name: 'C', value: 'Berlin', inline: true },
        { name: 'D', value: 'Madrid', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
