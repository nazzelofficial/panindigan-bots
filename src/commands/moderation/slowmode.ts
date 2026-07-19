import { PermissionFlagsBits, SlashCommandBuilder, ChannelType } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "slowmode",
  description: "Set slowmode on a text channel",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  cooldown: 5,
  aliases: ["sm"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("seconds").setDescription("Slowmode in seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel (default: current)").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const seconds = ctx.isSlash ? ctx.interaction!.options.getInteger("seconds", true) : parseInt(ctx.args[0] ?? "0") || 0;
    const targetChannel = ctx.isSlash
      ? (ctx.interaction!.options.getChannel("channel") ?? ctx.interaction!.channel)
      : ctx.message?.channel;

    if (!targetChannel || (targetChannel as any).type !== ChannelType.GuildText) {
      await ctx.reply({ embeds: [errorEmbed("Provide a text channel.")] }); return;
    }
    if (seconds < 0 || seconds > 21600) { await ctx.reply({ embeds: [errorEmbed("Slowmode must be between 0 and 21600 seconds.")] }); return; }

    await (targetChannel as any).setRateLimitPerUser(seconds, `Slowmode set by ${ctx.userId}`);

    if (seconds === 0) {
      await ctx.reply({ embeds: [successEmbed(`🐇 Slowmode disabled in <#${targetChannel.id}>.`)] });
    } else {
      await ctx.reply({ embeds: [successEmbed(`🐢 Slowmode set to **${seconds}s** in <#${targetChannel.id}>.`)] });
    }
  },
};
export default command;
