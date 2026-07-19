import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition';

export default {
  data: new SlashCommandBuilder()
    .setName('bot_status')
    .setDescription('Change the bot status')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Status type')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Idle', value: 'idle' },
          { name: 'Do Not Disturb', value: 'dnd' },
          { name: 'Invisible', value: 'invisible' }
        ))
    .addStringOption(option =>
      option.setName('activity')
        .setDescription('Activity message')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('activity_type')
        .setDescription('Activity type')
        .setRequired(false)
        .addChoices(
          { name: 'Playing', value: 'Playing' },
          { name: 'Watching', value: 'Watching' },
          { name: 'Listening', value: 'Listening to' },
          { name: 'Competing', value: 'Competing in' }
        )),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type', true) as 'online' | 'idle' | 'dnd' | 'invisible';
    const activity = interaction.options.getString('activity');
    const activityType = interaction.options.getString('activity_type') as 'Playing' | 'Watching' | 'Listening to' | 'Competing in' | undefined;
    
    await interaction.client.user.setStatus(type);
    
    if (activity && activityType) {
      const typeMap: Record<string,number> = {"Playing":0,"Streaming":1,"Listening to":2,"Watching":3,"Competing in":5}; await interaction.client.user.setActivity(activity, { type: (typeMap[activityType!] ?? 0) as any });
    } else if (activity) {
      await interaction.client.user.setActivity(activity);
    } else {
      await interaction.client.user.setActivity(null as any);
    }
    
    await interaction.reply({ content: `✅ Bot status updated to ${type}`, ephemeral: true });
  },
} as unknown as CommandDefinition;
