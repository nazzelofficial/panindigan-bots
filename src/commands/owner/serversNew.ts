import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { clientRegistry } from '../../structures/clientRegistry';

export default {
  data: new SlashCommandBuilder()
    .setName('servers_new')
    .setDescription('Show the newest servers that added the bot'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const client = clientRegistry.get()!;
    
    const newServers = Array.from(client.guilds.cache.values())
      .sort((a: any, b: any) => b.joinedAt!.getTime() - a.joinedAt!.getTime())
      .slice(0, 20);
    
    const embed = new EmbedBuilder()
      .setTitle('🆕 Newest Servers')
      .setColor('#00ff00')
      .setDescription(newServers.map((guild: any, index: number) => 
        `${index + 1}. **${guild.name}** - ${guild.memberCount} members (Joined: ${guild.joinedAt?.toLocaleDateString()}) (ID: ${guild.id})`
      ).join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
