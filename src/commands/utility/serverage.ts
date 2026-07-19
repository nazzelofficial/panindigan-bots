import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('serverage')
    .setDescription('View how old the server is'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;
    const created = guild?.createdAt;
    const age = created ? Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const embed = new EmbedBuilder()
      .setTitle('📅 Server Age')
      .setColor('#00ff00')
      .setDescription(`This server is ${age} days old`)
      .addFields(
        { name: 'Created', value: created?.toLocaleDateString() || 'Unknown', inline: true },
        { name: 'Days Old', value: age.toString(), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
