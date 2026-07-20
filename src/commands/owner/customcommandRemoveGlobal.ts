import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('customcommand_remove_global')
    .setDescription('Remove a global custom command')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Command name')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name', true);
    
    const system = await SystemModel.findOne({});
    const globalCustomCommands = system?.globalCustomCommands || {};
    
    if (!globalCustomCommands[name]) {
      return interaction.reply({ content: '❌ Custom command not found', ephemeral: true });
    }
    
    delete globalCustomCommands[name];
    
    await SystemModel.findOneAndUpdate(
      {},
      { globalCustomCommands },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Removed global custom command: ${name}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
