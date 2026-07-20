import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('systemlogs')
    .setDescription('View, clear, or download bot system logs')
    .addSubcommand(subcommand =>
      subcommand.setName('view')
        .setDescription('View recent system logs'))
    .addSubcommand(subcommand =>
      subcommand.setName('clear')
        .setDescription('Clear system logs'))
    .addSubcommand(subcommand =>
      subcommand.setName('download')
        .setDescription('Download full system logs')),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const logPath = path.join(process.cwd(), 'logs', 'bot.log');
    
    if (subcommand === 'view') {
      try {
        const logs = await fs.readFile(logPath, 'utf-8');
        const recentLogs = logs.split('\n').slice(-50).join('\n');
        
        if (recentLogs.length > 1900) {
          await interaction.reply({ content: `📝 Recent logs:\n\`\`\`\n${recentLogs.slice(0, 1900)}...\n\`\`\``, ephemeral: true });
        } else {
          await interaction.reply({ content: `📝 Recent logs:\n\`\`\`\n${recentLogs}\n\`\`\``, ephemeral: true });
        }
      } catch (error) {
        await interaction.reply({ content: '❌ No logs found', ephemeral: true });
      }
    } else if (subcommand === 'clear') {
      try {
        await fs.writeFile(logPath, '');
        await interaction.reply({ content: '✅ System logs cleared', ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: '❌ Failed to clear logs', ephemeral: true });
      }
    } else if (subcommand === 'download') {
      try {
        const logs = await fs.readFile(logPath, 'utf-8');
        await interaction.reply({ 
          content: '📁 System logs attached', 
          files: [{ attachment: Buffer.from(logs), name: 'bot.log' }],
          ephemeral: true 
        });
      } catch (error) {
        await interaction.reply({ content: '❌ No logs found', ephemeral: true });
      }
    }
  },
} as unknown as CommandDefinition;
