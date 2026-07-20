import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_removeserver')
    .setDescription('Remove a server from a pack')
    .addStringOption(option =>
      option.setName('pack_id')
        .setDescription('Pack ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('server_id')
        .setDescription('Server ID to remove')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const packId = interaction.options.getString('pack_id', true);
    const serverId = interaction.options.getString('server_id', true);
    
    const premium = await PremiumModel.findOne({ guildId: serverId });
    
    if (!premium || (premium as any).packId?.toString() !== packId) {
      return interaction.reply({ content: '❌ Server not found in this pack', ephemeral: true });
    }
    
    await PremiumModel.findOneAndUpdate(
      { guildId: serverId },
      { packId: null }
    );
    
    await interaction.reply({ 
      content: `✅ Removed server ${serverId} from pack ${packId}`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
