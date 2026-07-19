import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { PremiumModel } from '../../database/models/Premium';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_swapserver')
    .setDescription('Replace a server in a pack with another server')
    .addStringOption(option =>
      option.setName('pack_id')
        .setDescription('Pack ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('old_server_id')
        .setDescription('Server ID to remove')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('new_server_id')
        .setDescription('Server ID to add')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const packId = interaction.options.getString('pack_id', true);
    const oldServerId = interaction.options.getString('old_server_id', true);
    const newServerId = interaction.options.getString('new_server_id', true);
    
    const oldPremium = await PremiumModel.findOne({ guildId: oldServerId, packId });
    
    if (!oldPremium) {
      return interaction.reply({ content: '❌ Old server not found in this pack', ephemeral: true });
    }
    
    await PremiumModel.findOneAndUpdate(
      { guildId: oldServerId },
      { packId: null }
    );
    
    await PremiumModel.findOneAndUpdate(
      { guildId: newServerId },
      {
        guildId: newServerId,
        tier: 'enterprise',
        packId,
        grantedAt: new Date(),
        grantedBy: interaction.user.id,
        history: [{
          date: new Date(),
          action: 'grant',
          tier: 'enterprise',
          by: interaction.user.id
        }]
      },
      { upsert: true }
    );
    
    await interaction.reply({ 
      content: `✅ Swapped ${oldServerId} with ${newServerId} in pack ${packId}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
