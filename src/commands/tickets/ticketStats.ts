import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket_stats')
    .setDescription('View ticket statistics'),
  category: 'Tickets',
  accessTier: 'admin',
  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Ticket Statistics')
      .setColor('#00ff00')
      .addFields(
        { name: 'Total Tickets', value: '0', inline: true },
        { name: 'Open Tickets', value: '0', inline: true },
        { name: 'Closed Tickets', value: '0', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
