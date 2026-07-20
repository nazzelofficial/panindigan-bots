import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_codedelete')
    .setDescription('Delete a specific Premium code')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Premium code to delete')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code', true);
    
    const deleted = await PremiumModel.findOneAndDelete({ code: code.toUpperCase() });
    
    if (!deleted) {
      return interaction.reply({ content: '❌ Code not found', ephemeral: true });
    }
    
    await interaction.reply({ content: `✅ Deleted Premium code: ${code}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
