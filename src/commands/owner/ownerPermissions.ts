import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('owner_permissions')
    .setDescription('View permissions of a co-owner')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to check')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    
    const system = await SystemModel.findOne({});
    const coOwnerPerms = (system as any)?.coOwnerPermissions || {};
    const permissions = coOwnerPerms[userId] || ['all'];
    
    const embed = new EmbedBuilder()
      .setTitle(`🔐 Permissions for ${userId}`)
      .setColor('#00ff00')
      .setDescription(permissions.join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
