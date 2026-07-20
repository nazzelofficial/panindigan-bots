import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play rock paper scissors')
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Your choice')
        .setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' }
        )),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const userChoice = interaction.options.getString('choice', true);
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    
    let result = '';
    if (userChoice === botChoice) {
      result = 'It\'s a tie!';
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You win!';
    } else {
      result = 'I win!';
    }
    
    await interaction.reply({ content: `🪨📄✂️ You chose ${userChoice}, I chose ${botChoice}. ${result}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
