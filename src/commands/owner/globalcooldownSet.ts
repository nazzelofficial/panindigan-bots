import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('globalcooldown_set')
    .setDescription('Set global cooldown for a command')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Command name')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('Cooldown in seconds')
        .setRequired(true)
        .setMinValue(0)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString('command', true);
    const seconds = interaction.options.getInteger('seconds', true);
    
    const system = await SystemModel.findOne({});
    const globalCooldowns = system?.globalCooldowns || {};
    
    globalCooldowns[command] = seconds;
    
    await SystemModel.findOneAndUpdate(
      {},
      { globalCooldowns },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Set global cooldown for ${command} to ${seconds} seconds`, ephemeral: true });
  },
} as unknown as CommandDefinition;
