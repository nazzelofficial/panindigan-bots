import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';
import { SystemModel } from '../../database/models/System';

export default {
  data: new SlashCommandBuilder()
    .setName('language_set')
    .setDescription('Set the default language for the bot')
    .addStringOption(option =>
      option.setName('language')
        .setDescription('Language code')
        .setRequired(true)
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Tagalog', value: 'tl' },
          { name: 'Spanish', value: 'es' },
          { name: 'French', value: 'fr' },
          { name: 'German', value: 'de' },
          { name: 'Japanese', value: 'ja' },
          { name: 'Korean', value: 'ko' },
          { name: 'Chinese', value: 'zh' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const language = interaction.options.getString('language', true);
    
    await SystemModel.findOneAndUpdate(
      {},
      { defaultLanguage: language },
      { upsert: true }
    );
    
    await interaction.reply({ content: `✅ Set default language to ${language}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
