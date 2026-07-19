import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('blacklist_view')
    .setDescription('View blacklisted servers or users')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type to view')
        .setRequired(true)
        .addChoices(
          { name: 'Servers', value: 'servers' },
          { name: 'Users', value: 'users' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type', true);
    
    const system = await SystemModel.findOne({});
    const blacklists = (system as any)?.blacklists || { servers: [], users: [] };
    
    const list = type === 'servers' ? blacklists.servers : blacklists.users;
    
    if (list.length === 0) {
      return interaction.reply({ content: `❌ No blacklisted ${type}`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🚫 Blacklisted ${type.charAt(0).toUpperCase() + type.slice(1)}`)
      .setColor('#ff0000')
      .setDescription(list.join('\n'))
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
