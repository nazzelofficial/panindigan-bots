import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('globalunban')
    .setDescription('Globally unban a user from all bot servers')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('User ID to unban')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    const client = clientRegistry.get()!;
    
    const system = await SystemModel.findOne({});
    const globalBans = system?.globalBans || [];
    
    if (!globalBans.includes(userId)) {
      return interaction.reply({ content: '❌ User is not globally banned', ephemeral: true });
    }
    
    const newBans = globalBans.filter((id: string) => id !== userId);
    await SystemModel.findOneAndUpdate(
      {},
      { globalBans: newBans },
      { upsert: true }
    );
    
    let unbanCount = 0;
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.bans.remove(userId);
        unbanCount++;
      } catch (error) {
        // Skip if not banned or no permission
      }
    }
    
    await interaction.reply({ 
      content: `✅ Globally unbanned ${userId}. Unbanned from ${unbanCount} servers.`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
