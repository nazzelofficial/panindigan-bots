import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "logsconfig",
  description: "View the full logging configuration for this server",
  category: "Logging",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 10,
  aliases: ["logconfig", "loggingconfig"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const logging = (cfg as any)?.logging ?? {};
    const channels = logging.channels ?? {};
    const channelEntries = Object.entries(channels);
    const embed = baseEmbed("primary")
      .setTitle("📋 Logging Configuration")
      .addFields(
        { name: "Status", value: logging.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
        { name: "Log Channels", value: channelEntries.length ? channelEntries.map(([k, v]) => `**${k}:** <#${v}>`).join("\n").slice(0, 1000) : "None configured", inline: false },
        { name: "Disabled Events", value: (logging.disabledEvents ?? []).length ? (logging.disabledEvents as string[]).map((e: string) => `\`${e}\``).join(", ") : "None (all enabled)", inline: false },
        { name: "Ignored Channels", value: (logging.ignoredChannels ?? []).map((id: string) => `<#${id}>`).join(", ") || "None", inline: false },
        { name: "Ignored Users", value: (logging.ignoredUsers ?? []).map((id: string) => `<@${id}>`).join(", ") || "None", inline: false },
      );
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
