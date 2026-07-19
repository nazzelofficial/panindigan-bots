import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('owner_revoke')
    .setDescription('Revoke co-owner access from a user')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to revoke access')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    
    const system = await SystemModel.findOne({});
    const coOwners = (system as any)?.coOwners || [];
    
    if (!coOwners.includes(userId)) {
      return interaction.reply({ content: '❌ User is not a co-owner', ephemeral: true });
    }
    
    const newCoOwners = coOwners.filter((id: string) => id !== userId);
    await SystemModel.findOneAndUpdate(
      {},
      { coOwners: newCoOwners },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Revoked co-owner access from ${userId}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
