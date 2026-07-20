import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { CommandDefinition } from '../../structures/CommandDefinition.js';
import { GuildModel } from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('welcome_test')
    .setDescription('Send a test welcome message to the configured welcome channel')
    .addUserOption(o =>
      o.setName('user').setDescription('Simulate welcome for this user (default: yourself)').setRequired(false)),
  category: 'Welcome',
  accessTier: 'admin',
  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const targetUser = interaction.options.getUser('user') ?? interaction.user;

    await interaction.deferReply({ ephemeral: true });

    const guildDoc = await GuildModel.findOne({ guildId: guild.id }).lean() as any;
    const welcome = guildDoc?.welcome;

    if (!welcome?.enabled || !welcome?.channelId) {
      return interaction.editReply({
        content: '❌ Welcome system is not configured or disabled. Use `/setup welcome` to enable it first.',
      });
    }

    const channel = guild.channels.cache.get(welcome.channelId) as TextChannel | undefined;
    if (!channel?.isTextBased()) {
      return interaction.editReply({
        content: `❌ The configured welcome channel (<#${welcome.channelId}>) no longer exists or is not a text channel. Reconfigure it with \`/setup welcome\`.`,
      });
    }

    // Build the welcome message — interpolate placeholders the bot supports
    const memberCount = guild.memberCount;
    const userName = targetUser.username;
    const userMention = `<@${targetUser.id}>`;
    const guildName = guild.name;

    const interpolate = (template: string): string =>
      template
        .replace(/\{user\}/g, userMention)
        .replace(/\{username\}/g, userName)
        .replace(/\{server\}/g, guildName)
        .replace(/\{membercount\}/g, memberCount.toString())
        .replace(/\{count\}/g, memberCount.toString());

    // Build embed or plain message
    if (welcome.embedEnabled) {
      const embed = new EmbedBuilder()
        .setTitle(interpolate(welcome.embedTitle ?? '👋 Welcome to {server}!'))
        .setDescription(interpolate(welcome.embedDescription ?? 'Welcome {user}! You are member **#{membercount}**.'))
        .setColor(welcome.embedColor ?? '#5865F2')
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .setTimestamp();

      if (welcome.embedImage) embed.setImage(welcome.embedImage);
      if (welcome.embedFooter) embed.setFooter({ text: interpolate(welcome.embedFooter) });

      await channel.send({ content: welcome.pingOnJoin ? userMention : undefined, embeds: [embed] });
    } else {
      const message = interpolate(welcome.message ?? '👋 Welcome to **{server}**, {user}! You are member **#{membercount}**.');
      await channel.send(message);
    }

    return interaction.editReply({
      content: `✅ Test welcome message sent to <#${welcome.channelId}> for **${targetUser.tag}**.\n\n*This is a preview — the real event fires when a member actually joins.*`,
    });
  },
} as unknown as CommandDefinition;
