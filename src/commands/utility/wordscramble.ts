import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('wordscramble')
    .setDescription('Unscramble the word'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const words = ['DISCORD', 'BOT', 'SERVER', 'CHANNEL'];
    const word = words[Math.floor(Math.random() * words.length)];
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    
    const embed = new EmbedBuilder()
      .setTitle('🔤 Word Scramble')
      .setColor('#00ff00')
      .setDescription(`Unscramble: ${scrambled}`)
      .setFooter({ text: 'Type your answer!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
