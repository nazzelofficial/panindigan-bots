import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('disable_global')
    .setDescription('Disable a command globally')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Command name to disable')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString('command', true);
    
    const system = await SystemModel.findOne({});
    const disabledCommands = system?.globalDisabledCommands || [];
    
    if (disabledCommands.includes(command)) {
      return interaction.reply({ content: '❌ Command is already globally disabled', ephemeral: true });
    }
    
    disabledCommands.push(command);
    await SystemModel.findOneAndUpdate(
      {},
      { disabledGlobalCommands: disabledCommands },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Globally disabled command: ${command}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
