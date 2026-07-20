import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('utilityriddle')
    .setDescription('Get a riddle to solve'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const riddles = [
      { q: 'What has keys but no locks?', a: 'Piano' },
      { q: 'What has a face and two hands but no arms?', a: 'Clock' },
      { q: 'What gets wet while drying?', a: 'Towel' },
    ];
    const riddle = riddles[Math.floor(Math.random() * riddles.length)];
    
    const embed = new EmbedBuilder()
      .setTitle('🧩 Riddle')
      .setColor('#00ff00')
      .setDescription(riddle.q)
      .setFooter({ text: 'Type your answer!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
