import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_list')
    .setDescription('List all servers with Premium'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const premiums = await PremiumModel.find({});
    
    if (premiums.length === 0) {
      return interaction.reply({ content: '❌ No servers have Premium', ephemeral: true });
    }
    
    const tierCounts = { basic: 0, standard: 0, gold: 0, enterprise: 0 };
    premiums.forEach((p: any) => tierCounts[p.tier as keyof typeof tierCounts]++);
    
    const embed = new EmbedBuilder()
      .setTitle('💎 Premium Servers')
      .setColor('#ffd700')
      .addFields(
        { name: 'Total Premium Servers', value: premiums.length.toString(), inline: true },
        { name: 'Basic', value: tierCounts.basic.toString(), inline: true },
        { name: 'Standard', value: tierCounts.standard.toString(), inline: true },
        { name: 'Gold', value: tierCounts.gold.toString(), inline: true },
        { name: 'Enterprise', value: tierCounts.enterprise.toString(), inline: true }
      )
      .setDescription(premiums.slice(0, 20).map((p: any) => 
        `**${p.guildId}** - ${p.tier.toUpperCase()} (Since: ${p.grantedAt?.toLocaleDateString()})`
      ).join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
