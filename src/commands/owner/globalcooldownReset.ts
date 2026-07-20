import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('globalcooldown_reset')
    .setDescription('Reset all cooldowns for a user')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to reset cooldowns for')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    
    const system = await SystemModel.findOne({});
    const userCooldowns = (system as any)?.userCooldowns || {};
    
    delete userCooldowns[userId];
    
    await SystemModel.findOneAndUpdate(
      {},
      { userCooldowns },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Reset all cooldowns for user ${userId}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
