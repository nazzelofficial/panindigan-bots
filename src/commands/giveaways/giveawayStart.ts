import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { randomUUID } from "node:crypto";

const command: CommandDefinition = {
  name: "giveawaystart",
  description: "Start a giveaway in this channel",
  category: "Giveaways",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 10,
  aliases: ["gcreate", "gstart"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("prize").setDescription("What are you giving away?").setRequired(true).setMaxLength(200))
      .addStringOption((o) => o.setName("duration").setDescription("Duration (e.g. 1h, 30m, 1d)").setRequired(true))
      .addIntegerOption((o) => o.setName("winners").setDescription("Number of winners (default: 1)").setRequired(false).setMinValue(1).setMaxValue(20))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel for the giveaway (default: current channel)").setRequired(false))
      .addStringOption((o) => o.setName("description").setDescription("Additional description").setRequired(false).setMaxLength(500)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const prize = ctx.isSlash ? ctx.interaction!.options.getString("prize", true) : ctx.args[0];
    if (!prize) { await ctx.reply({ embeds: [errorEmbed("Please provide a prize.")] }); return; }
    const durationStr = ctx.isSlash ? ctx.interaction!.options.getString("duration", true) : ctx.args[1] ?? "1h";
    const winnerCount = ctx.isSlash ? (ctx.interaction!.options.getInteger("winners") ?? 1) : (parseInt(ctx.args[2] ?? "1") || 1);
    const channelId = ctx.isSlash ? (ctx.interaction!.options.getChannel("channel")?.id ?? ctx.interaction!.channelId) : (ctx.message?.channelId ?? "");
    const description = ctx.isSlash ? (ctx.interaction!.options.getString("description") ?? null) : null;

    // Parse duration
    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 60_000) { await ctx.reply({ embeds: [errorEmbed("Invalid duration. Examples: `10m`, `1h`, `2d`. Minimum: 1 minute.")] }); return; }
    if (durationMs > 7 * 24 * 60 * 60 * 1000) { await ctx.reply({ embeds: [errorEmbed("Maximum giveaway duration is 7 days.")] }); return; }

    const ch = guild.channels.cache.get(channelId);
    if (!ch?.isTextBased()) { await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] }); return; }

    const endsAt = new Date(Date.now() + durationMs);
    const embed = baseEmbed("primary")
      .setTitle(`🎉 GIVEAWAY — ${prize}`)
      .setDescription(`${description ? `${description}\n\n` : ""}React with 🎉 to enter!\n\n**Winners:** ${winnerCount}\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`)
      .setFooter({ text: `Hosted by ${ctx.isSlash ? ctx.interaction!.user.username : ctx.message?.author.username ?? "Unknown"}` })
      .setTimestamp(endsAt);

    const msg = await (ch as any).send({ embeds: [embed] });
    await msg.react("🎉");

    await GiveawayModel.create({
      id: randomUUID(),
      guildId: guild.id,
      channelId,
      messageId: msg.id,
      prize,
      description,
      winnerCount,
      hostId: ctx.userId,
      endsAt,
      paused: false,
      ended: false,
      participants: [],
      bonusEntries: [],
      requirements: [],
      blacklistedUserIds: [],
    });

    await ctx.reply({ embeds: [successEmbed(`Giveaway started in <#${channelId}>! It ends <t:${Math.floor(endsAt.getTime() / 1000)}:R>.`)], ...(ctx.isSlash ? { ephemeral: true } : {}) });
  },
};

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "s") return n * 1000;
  if (unit === "m") return n * 60 * 1000;
  if (unit === "h") return n * 3600 * 1000;
  if (unit === "d") return n * 86400 * 1000;
  return null;
}

export default command;
