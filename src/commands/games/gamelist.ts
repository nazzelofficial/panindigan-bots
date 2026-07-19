import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { CommandDefinition } from '@/structures/types';
import { baseEmbed } from '@/utils/embeds';

const command: CommandDefinition = {
  name: 'gamelist',
  description: 'List all available games',
  category: 'Games',
  access: 'general',
  guildOnly: false,
  cooldown: 5,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const embed = new EmbedBuilder()
      .setTitle('🎮 Available Games')
      .setColor('#00ff00')
      .setDescription('Play any of these games:')
      .addFields(
        { name: 'TicTacToe', value: '/tictactoe', inline: true },
        { name: 'Connect4', value: '/connect4', inline: true },
        { name: 'RPS', value: '/rps', inline: true },
        { name: 'Trivia', value: '/trivia', inline: true },
        { name: 'Hangman', value: '/hangman', inline: true },
        { name: 'Wordle', value: '/wordle', inline: true },
        { name: 'CoinFlip', value: '/coinflip', inline: true },
        { name: 'Dice', value: '/dice', inline: true },
        { name: 'Blackjack', value: '/blackjack', inline: true },
        { name: 'Baccarat', value: '/baccarat', inline: true },
        { name: 'Crash', value: '/crash', inline: true },
        { name: 'Crossword', value: '/crossword', inline: true },
      )
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
