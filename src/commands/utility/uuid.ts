import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';

export default {
  data: new SlashCommandBuilder()
    .setName('uuid')
    .setDescription('Generate a random UUID'),
  category: 'Utility',
  accessTier: 'user',
  async execute(interaction: ChatInputCommandInteraction) {
    const uuid = crypto.randomUUID();
    
    await interaction.reply({ content: `🔑 Generated UUID: \`${uuid}\``, ephemeral: true });
  },
} as unknown as CommandDefinition;
