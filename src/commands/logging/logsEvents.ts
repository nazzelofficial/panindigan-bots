import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const VALID_EVENTS = [
  "messageDelete", "messageUpdate", "memberJoin", "memberLeave", "memberUpdate",
  "banAdd", "banRemove", "roleCreate", "roleDelete", "roleUpdate",
  "channelCreate", "channelDelete", "channelUpdate", "voiceJoin", "voiceLeave",
  "voiceMove", "inviteCreate", "inviteDelete", "warn", "mod",
];

const command: CommandDefinition = {
  name: "logsevents",
  description: "Toggle specific log events on or off",
  category: "Logging",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["logevent", "logtoggleevent"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("event").setDescription("Event to toggle").setRequired(true)
          .addChoices(...VALID_EVENTS.map((e) => ({ name: e, value: e }))),
      )
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable this event").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const event = ctx.isSlash ? ctx.interaction!.options.getString("event", true) : ctx.args[0];
    const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "off";
    if (!event || !VALID_EVENTS.includes(event)) {
      await ctx.reply({ embeds: [errorEmbed(`Invalid event. Valid events: ${VALID_EVENTS.join(", ")}`)] }); return;
    }
    if (enabled) {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "logging.disabledEvents": event } });
    } else {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "logging.disabledEvents": event } }, { upsert: true });
    }
    await ctx.reply({ embeds: [successEmbed(`\`${event}\` logging **${enabled ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
