import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('bot_info')
    .setDescription('View bot identity and information'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .setColor('#00ff00')
      .setThumbnail(client.user!.displayAvatarURL())
      .addFields(
        { name: 'ID', value: client.user!.id, inline: true },
        { name: 'Username', value: client.user!.tag, inline: true },
        { name: 'Created At', value: client.user!.createdAt.toLocaleDateString(), inline: true },
        { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
        { name: 'Users', value: client.users.cache.size.toString(), inline: true },
        { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
