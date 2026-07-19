import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('owner_grant')
    .setDescription('Grant co-owner access to a user')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to grant access')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    
    const system = await SystemModel.findOne({});
    const coOwners = (system as any)?.coOwners || [];
    
    if (coOwners.includes(userId)) {
      return interaction.reply({ content: '❌ User is already a co-owner', ephemeral: true });
    }
    
    coOwners.push(userId);
    await SystemModel.findOneAndUpdate(
      {},
      { coOwners },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Granted co-owner access to ${userId}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
