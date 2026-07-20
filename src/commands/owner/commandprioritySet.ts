import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('commandpriority_set')
    .setDescription('Set execution priority for a command')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Command name')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Priority level (1-10, higher = higher priority)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString('command', true);
    const level = interaction.options.getInteger('level', true);
    
    const system = await SystemModel.findOne({});
    const commandPriorities = (system as any)?.commandPriorities || {};
    
    commandPriorities[command] = level;
    
    await SystemModel.findOneAndUpdate(
      {},
      { commandPriorities },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Set priority for ${command} to level ${level}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
