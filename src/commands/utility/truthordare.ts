import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('utilitytruthordare')
    .setDescription('Play Truth or Dare')
    .addStringOption(option =>
      option.setName('choice')
        .setDescription('Choose truth or dare')
        .setRequired(true)
        .addChoices(
          { name: 'Truth', value: 'truth' },
          { name: 'Dare', value: 'dare' }
        )),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const choice = interaction.options.getString('choice', true);
    
    const truths = ['What is your biggest fear?', 'What is your most embarrassing moment?'];
    const dares = ['Do 10 pushups', 'Sing a song out loud'];
    
    const result = choice === 'truth' 
      ? truths[Math.floor(Math.random() * truths.length)]
      : dares[Math.floor(Math.random() * dares.length)];
    
    const embed = new EmbedBuilder()
      .setTitle('🎭 Truth or Dare')
      .setColor('#00ff00')
      .setDescription(result)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
