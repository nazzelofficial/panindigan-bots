import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rollout_enable')
    .setDescription('Enable a feature rollout')
    .addStringOption(option =>
      option.setName('feature')
        .setDescription('Feature name')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('phase')
        .setDescription('Rollout phase')
        .setRequired(true)
        .addChoices(
          { name: 'Alpha', value: 'alpha' },
          { name: 'Beta', value: 'beta' },
          { name: 'Stable', value: 'stable' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const feature = interaction.options.getString('feature', true);
    const phase = interaction.options.getString('phase', true);
    
    const system = await SystemModel.findOne({});
    const rollouts = (system as any)?.rollouts || {};
    
    rollouts[feature] = { phase, enabled: true, enabledAt: new Date() };
    
    await SystemModel.findOneAndUpdate(
      {},
      { rollouts },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Enabled ${feature} rollout in ${phase} phase`, ephemeral: true });
  },
} as unknown as CommandDefinition;
