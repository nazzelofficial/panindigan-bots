import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "joingate",
  description: "Block accounts below a minimum age from joining (anti-alt protection)",
  category: "Admin",
  access: "admin",
  premium: true,
  memberPermissions: [PermissionFlagsBits.ManageGuild, PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  cooldown: 5,
  aliases: ["accountage", "minaccountage", "antialt"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("setup")
          .setDescription("Block accounts younger than a minimum age from joining")
          .addIntegerOption((o) => o.setName("days").setDescription("Minimum account age in days").setRequired(true).setMinValue(1).setMaxValue(365))
          .addStringOption((o) => o.setName("message").setDescription("DM message sent to blocked accounts").setRequired(false)),
      )
      .addSubcommand((s) => s.setName("disable").setDescription("Disable the join gate"))
      .addSubcommand((s) => s.setName("status").setDescription("View current join gate configuration")),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "status";

    if (sub === "setup") {
      const days = ctx.isSlash ? ctx.interaction!.options.getInteger("days", true) : parseInt(ctx.args[1]) || 7;
      const message = ctx.isSlash
        ? (ctx.interaction!.options.getString("message") ?? null)
        : ctx.args.slice(2).join(" ") || null;

      if (days < 1 || days > 365) { await ctx.reply({ embeds: [errorEmbed("Minimum account age must be between 1 and 365 days.")] }); return; }

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        {
          $set: {
            "joinGate.enabled": true,
            "joinGate.minAccountAgeDays": days,
            "joinGate.kickMessage": message ?? `Your account is too new to join **${guild.name}**. Please wait until your account is at least ${days} days old.`,
          },
        },
        { upsert: true },
      );

      await ctx.reply({
        embeds: [
          successEmbed(
            `🛡️ **Join Gate Enabled**\nMinimum account age: **${days} day${days !== 1 ? "s" : ""}**\n\nAccounts younger than ${days} days will be automatically kicked when they try to join.\n${message ? `DM message: "${message}"` : ""}`,
          ),
        ],
      });

    } else if (sub === "disable") {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (!(doc as any)?.joinGate?.enabled) { await ctx.reply({ embeds: [infoEmbed("Join gate is not currently active.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "joinGate.enabled": false } });
      await ctx.reply({ embeds: [successEmbed("Join gate disabled. All accounts can now join the server.")] });

    } else {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
      const gate = (doc as any)?.joinGate;
      if (!gate?.enabled) { await ctx.reply({ embeds: [infoEmbed("Join gate is not configured. Use `/joingate setup [days]` to enable it.")] }); return; }
      await ctx.reply({
        embeds: [
          successEmbed(
            `🛡️ **Join Gate Status: Active**\nMinimum account age: **${gate.minAccountAgeDays} day${gate.minAccountAgeDays !== 1 ? "s" : ""}**\nKick message: "${gate.kickMessage}"`,
          ),
        ],
      });
    }
  },
};
export default command;
