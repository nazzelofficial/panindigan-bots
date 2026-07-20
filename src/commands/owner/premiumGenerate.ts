import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { PremiumModel } from '../../database/models/Premium.js';
import { nanoid } from '../../utils/nanoid.js';

export default {
  data: new SlashCommandBuilder()
    .setName('premium_generate')
    .setDescription('Generate Premium activation codes')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('Premium tier')
        .setRequired(true)
        .addChoices(
          { name: 'Basic', value: 'basic' },
          { name: 'Standard', value: 'standard' },
          { name: 'Gold', value: 'gold' },
          { name: 'Enterprise', value: 'enterprise' }
        ))
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of codes to generate')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const tier = interaction.options.getString('tier', true) as 'basic' | 'standard' | 'gold' | 'enterprise';
    const count = interaction.options.getInteger('count', true);
    
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = nanoid(12).toUpperCase();
      
      await PremiumModel.create({
        code,
        tier,
        used: false,
        createdAt: new Date()
      });
      
      codes.push(code);
    }
    
    await interaction.reply({ 
      content: `✅ Generated ${count} ${tier.toUpperCase()} Premium codes:\n\`\`\`\n${codes.join('\n')}\n\`\`\``, 
      ephemeral: true 
    });
  },
} as unknown as CommandDefinition;
