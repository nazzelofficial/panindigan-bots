import { SlashCommandBuilder, ChatInputCommandInteraction, ActivityType } from 'discord.js';

const ACTIVITY_MAP: Record<string, number> = {
  playing: ActivityType.Playing,
  watching: ActivityType.Watching,
  listening: ActivityType.Listening,
  streaming: ActivityType.Streaming,
  competing: ActivityType.Competing,
};

export default {
  data: new SlashCommandBuilder()
    .setName('setactivity')
    .setDescription("Set the bot's activity/presence")
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'playing' },
          { name: 'Watching', value: 'watching' },
          { name: 'Listening to', value: 'listening' },
          { name: 'Streaming', value: 'streaming' },
          { name: 'Competing in', value: 'competing' },
        ))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Activity text')
        .setRequired(true)
        .setMaxLength(128))
    .addStringOption(option =>
      option.setName('url')
        .setDescription('Stream URL (required for Streaming type)')
        .setRequired(false)),
  category: 'Owner',
  accessTier: 'owner',
  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('type', true);
    const text = interaction.options.getString('text', true);
    const url = interaction.options.getString('url') ?? undefined;

    const activityType = ACTIVITY_MAP[type] ?? ActivityType.Playing;

    interaction.client.user.setActivity({
      name: text,
      type: activityType,
      ...(activityType === ActivityType.Streaming && url ? { url } : {}),
    });

    const labels: Record<string, string> = {
      playing: 'Playing',
      watching: 'Watching',
      listening: 'Listening to',
      streaming: 'Streaming',
      competing: 'Competing in',
    };

    await interaction.reply({
      content: `✅ Activity set to **${labels[type]} ${text}**${url ? ` (<${url}>)` : ''}.`,
      ephemeral: true,
    });
  },
}
