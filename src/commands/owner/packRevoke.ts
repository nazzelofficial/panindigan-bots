import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pack_revoke')
    .setDescription('Revoke an entire Server Pack')
    .addStringOption(option =>
      option.setName('pack_id')
        .setDescription('Pack ID')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const packId = interaction.options.getString('pack_id', true);
    
    const premiums = await PremiumModel.find({ packId });
    
    if (premiums.length === 0) {
      return interaction.reply({ content: '❌ Pack not found', ephemeral: true });
    }
    
    for (const premium of premiums) {
      await PremiumModel.findOneAndDelete({ guildId: premium.guildId });
    }
    
    await interaction.reply({ 
      content: `✅ Revoked pack ${packId} (${premiums.length} servers)`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
