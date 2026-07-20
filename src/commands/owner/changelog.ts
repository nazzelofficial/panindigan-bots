import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { clientRegistry } from '../../structures/clientRegistry.js';

export default {
  data: new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Post changelog/update announcement to all servers')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Changelog message')
        .setRequired(true)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message', true);
    const client = clientRegistry.get()!;
    
    await interaction.reply({ content: '📢 Broadcasting changelog to all servers...', ephemeral: true });
    
    let successCount = 0;
    let failCount = 0;
    
    const embed = new EmbedBuilder()
      .setTitle('📢 Panindigan Official Update')
      .setDescription(message)
      .setColor('#00ff00')
      .setTimestamp();
    
    for (const guild of client.guilds.cache.values()) {
      try {
        const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me!).has('SendMessages'));
        
        if (channel && 'send' in channel) {
          await channel.send({ embeds: [embed] });
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    
    await interaction.followUp({ 
      content: `✅ Broadcast complete: ${successCount} servers, ${failCount} failed`, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
