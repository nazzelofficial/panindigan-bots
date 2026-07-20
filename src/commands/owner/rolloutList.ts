import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rollout_list')
    .setDescription('List all feature rollouts'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const system = await SystemModel.findOne({});
    const rollouts = (system as any)?.rollouts || {};
    
    const features = Object.entries(rollouts);
    
    if (features.length === 0) {
      return interaction.reply({ content: '❌ No active rollouts', ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🚀 Feature Rollouts')
      .setColor('#00ff00')
      .setDescription(features.map(([name, data]: [string, any]) => 
        `**${name}**: ${data.phase} - ${data.enabled ? '✅ Enabled' : '❌ Disabled'}`
      ).join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
