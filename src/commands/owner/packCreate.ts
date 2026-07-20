import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';
import { nanoid } from '../../utils/nanoid.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_create')
    .setDescription('Create a new Server Pack and grant Enterprise Premium')
    .addStringOption(option =>
      option.setName('server_ids')
        .setDescription('Comma-separated server IDs')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('pack')
        .setDescription('Server pack type')
        .setRequired(true)
        .addChoices(
          { name: '3-Server Pack', value: '3-server' },
          { name: '5-Server Pack', value: '5-server' },
          { name: '10-Server Pack', value: '10-server' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const serverIdsStr = interaction.options.getString('server_ids', true);
    const pack = interaction.options.getString('pack', true);
    
    const serverIds = serverIdsStr.split(',').map(id => id.trim());
    const packId = nanoid(8).toUpperCase();
    
    for (const serverId of serverIds) {
      await PremiumModel.findOneAndUpdate(
        { guildId: serverId },
        {
          guildId: serverId,
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
    }
    
    await interaction.reply({ 
      content: `✅ Created ${pack} (ID: ${packId}) with ${serverIds.length} servers`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
