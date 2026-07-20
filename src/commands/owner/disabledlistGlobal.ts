import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('disabledlist_global')
    .setDescription('List all globally disabled commands'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const system = await SystemModel.findOne({});
    const disabledCommands = system?.globalDisabledCommands || [];
    
    if (disabledCommands.length === 0) {
      return interaction.reply({ content: '❌ No globally disabled commands', ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🚫 Globally Disabled Commands')
      .setColor('#ff0000')
      .setDescription(disabledCommands.join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
