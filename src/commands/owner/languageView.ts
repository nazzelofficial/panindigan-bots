import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { SystemModel } from '../../database/models/System.js';

export default {
  data: new SlashCommandBuilder()
    .setName('language_view')
    .setDescription('View the default language'),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const system = await SystemModel.findOne({});
    const language = (system as any)?.defaultLanguage || 'en';
    
    const embed = new EmbedBuilder()
      .setTitle('🌐 Default Language')
      .setColor('#00ff00')
      .addFields(
        { name: 'Language Code', value: language.toUpperCase(), inline: true }
      )
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
} as unknown as CommandDefinition;
