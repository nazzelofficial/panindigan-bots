import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('envcheck')
    .setDescription('Verify required environment configurations'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const requiredVars = [
      'DISCORD_TOKEN',
      'DISCORD_CLIENT_ID',
      'MONGODB_URI',
      'SESSION_SECRET'
    ];
    
    const optionalVars = [
      'OPENAI_API_KEY',
      'LAVALINK_HOST',
      'LAVALINK_PORT',
      'LAVALINK_PASSWORD',
      'REST_API_KEY'
    ];
    
    const requiredStatus = requiredVars.map(v => ({
      name: v,
      status: process.env[v] ? '✅ Set' : '❌ Missing'
    }));
    
    const optionalStatus = optionalVars.map(v => ({
      name: v,
      status: process.env[v] ? '✅ Set' : '⚪ Not Set'
    }));
    
    const embed = new EmbedBuilder()
      .setTitle('🔧 Environment Configuration Check')
      .setColor('#00ff00')
      .addFields(
        { name: 'Required Variables', value: requiredStatus.map(s => `${s.status} ${s.name}`).join('\n'), inline: true },
        { name: 'Optional Variables', value: optionalStatus.map(s => `${s.status} ${s.name}`).join('\n'), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
