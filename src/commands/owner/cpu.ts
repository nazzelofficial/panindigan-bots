import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('cpu')
    .setDescription('View bot CPU usage and uptime'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const uptime = process.uptime();
    
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const cpuUsage = process.cpuUsage();
    const userCpu = (cpuUsage.user / 1000000).toFixed(2);
    const systemCpu = (cpuUsage.system / 1000000).toFixed(2);
    
    const embed = new EmbedBuilder()
      .setTitle('🖥️ CPU Usage')
      .setColor('#00ff00')
      .addFields(
        { name: 'Uptime', value: `${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: 'User CPU Time', value: `${userCpu}s`, inline: true },
        { name: 'System CPU Time', value: `${systemCpu}s`, inline: true },
        { name: 'Platform', value: process.platform, inline: true },
        { name: 'Node Version', value: process.version, inline: true },
        { name: 'CPU Count', value: process.env.NUMBER_OF_CPUS || 'Unknown', inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
