import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('featureflag')
    .setDescription('List and toggle internal feature flags')
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all feature flags'))
    .addSubcommand(subcommand =>
      subcommand.setName('toggle')
        .setDescription('Toggle a feature flag')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Feature flag name')
            .setRequired(true))),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'list') {
      const system = await SystemModel.findOne({});
      const flags = (system as any)?.featureFlags || {};
      
      const embed = new EmbedBuilder()
        .setTitle('🚩 Feature Flags')
        .setColor('#00ff00')
        .setDescription(Object.entries(flags).map(([name, enabled]) => 
          `${enabled ? '✅' : '❌'} ${name}`
        ).join('\n') || 'No feature flags set')
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === 'toggle') {
      const name = interaction.options.getString('name', true);
      
      const system = await SystemModel.findOne({});
      const flags = (system as any)?.featureFlags || {};
      
      flags[name] = !flags[name];
      
      await SystemModel.findOneAndUpdate(
        {},
        { featureFlags: flags },
        { upsert: true }
      );
      
      await interaction.reply({ 
        content: `✅ Feature flag "${name}" is now ${flags[name] ? 'enabled' : 'disabled'}`, 
        ephemeral: true 
      });
    }
  },
} as unknown as CommandDefinition;
