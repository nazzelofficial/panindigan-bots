import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('servers_search')
    .setDescription('Search for a server in the bot list')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Server name to search for')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const searchName = interaction.options.getString('name', true).toLowerCase();
    const client = clientRegistry.get()!;
    
    const matches = Array.from(client.guilds.cache.values())
      .filter((guild: any) => guild.name.toLowerCase().includes(searchName))
      .slice(0, 10);
    
    if (matches.length === 0) {
      return interaction.reply({ content: '❌ No servers found matching that name', ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Search Results: "${searchName}"`)
      .setColor('#00ff00')
      .setDescription(matches.map((guild: any) => 
        `**${guild.name}** - ${guild.memberCount} members (ID: ${guild.id})`
      ).join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
