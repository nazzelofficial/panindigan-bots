import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export default {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Pull the latest update from git and restart the bot automatically'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: '🔄 Pulling latest update from git...', ephemeral: true });

    try {
      const { stdout: pullOut, stderr: pullErr } = await execAsync('git pull', { timeout: 30_000 });
      const output = (pullOut || pullErr || '(no output)').trim().slice(0, 1800);

      if (output.includes('Already up to date')) {
        await interaction.followUp({ content: `✅ Already up to date:\n\`\`\`\n${output}\n\`\`\``, ephemeral: true });
        return;
      }

      await interaction.followUp({
        content: `✅ Update pulled:\n\`\`\`\n${output}\n\`\`\`\n🔄 Restarting bot now...`,
        ephemeral: true,
      });

      setTimeout(() => process.exit(0), 1000);
    } catch (error: any) {
      await interaction.followUp({ content: `❌ Update failed: ${error.message?.slice(0, 1800)}`, ephemeral: true });
    }
  },
}
