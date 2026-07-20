import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_codeinfo')
    .setDescription('View information about a Premium code')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Premium code to check')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code', true);
    
    const premiumCode = await PremiumModel.findOne({ code: code.toUpperCase() });
    
    if (!premiumCode) {
      return interaction.reply({ content: '❌ Code not found', ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`💎 Premium Code Info: ${code}`)
      .setColor('#ffd700')
      .addFields(
        { name: 'Tier', value: premiumCode.tier.toUpperCase(), inline: true },
        { name: 'Status', value: (premiumCode as any).used ? '✅ Used' : '❌ Unused', inline: true },
        { name: 'Created At', value: premiumCode.createdAt?.toLocaleString() || 'Unknown', inline: true }
      )
      .setTimestamp();
    
    if ((premiumCode as any).used && (premiumCode as any).usedBy) {
      embed.addFields(
        { name: 'Used By', value: (premiumCode as any).usedBy, inline: true },
        { name: 'Used At', value: (premiumCode as any).usedAt?.toLocaleString() || 'Unknown', inline: true }
      );
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
