import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const LOG_EVENTS = [
  "messageDelete", "messageUpdate", "memberJoin", "memberLeave", "memberUpdate",
  "banAdd", "banRemove", "roleCreate", "roleDelete", "roleUpdate",
  "channelCreate", "channelDelete", "channelUpdate", "voiceJoin", "voiceLeave",
  "voiceMove", "inviteCreate", "inviteDelete", "warn", "mod",
] as const;

const command: CommandDefinition = {
  name: "logschannel",
  description: "Set the log channel for a specific event type (or all events)",
  category: "Logging",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["setlogchannel", "logchannel"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send logs to").setRequired(true))
      .addStringOption((o) =>
        o.setName("event").setDescription("Event type (leave empty to set as the default for all)").setRequired(false)
          .addChoices(...LOG_EVENTS.map((e) => ({ name: e, value: e }))),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
    const event = ctx.isSlash ? ctx.interaction!.options.getString("event") ?? "default" : ctx.args[1] ?? "default";
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] }); return; }
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { [`logging.channels.${event}`]: channelId, "logging.enabled": true } },
      { upsert: true },
    );
    await ctx.reply({ embeds: [successEmbed(`${event === "default" ? "Default log" : `\`${event}\` log`} channel set to <#${channelId}>.`)] });
  },
};
export default command;
