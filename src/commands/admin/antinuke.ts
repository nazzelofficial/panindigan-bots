import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed, infoEmbed } from "../../utils/embeds.js";

// Valid action keys that map to antinuke.thresholds.* in the schema
const THRESHOLD_ACTIONS = ["channelDelete", "channelCreate", "ban", "kick", "roleDelete", "webhookCreate"] as const;
type ThresholdAction = typeof THRESHOLD_ACTIONS[number];

const command: CommandDefinition = {
  name: "antinuke",
  description: "Configure anti-nuke protection — enable, disable, whitelist, threshold, punishment, and status",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("enable")
          .setDescription("Enable anti-nuke protection for this server")
          .addStringOption((o) =>
            o
              .setName("punishment")
              .setDescription("Punishment applied to the nuker")
              .setRequired(false)
              .addChoices(
                { name: "Ban", value: "ban" },
                { name: "Kick", value: "kick" },
                { name: "Strip Roles", value: "strip-roles" },
              ),
          )
          .addIntegerOption((o) =>
            o.setName("threshold").setDescription("Global action threshold (default: 3)").setRequired(false).setMinValue(1).setMaxValue(20),
          )
          .addIntegerOption((o) =>
            o.setName("window").setDescription("Detection window in seconds (default: 10)").setRequired(false).setMinValue(3).setMaxValue(60),
          ),
      )
      .addSubcommand((s) => s.setName("disable").setDescription("Disable anti-nuke protection"))
      .addSubcommand((s) =>
        s
          .setName("whitelist")
          .setDescription("Add or remove a trusted user from the anti-nuke whitelist")
          .addStringOption((o) =>
            o
              .setName("action")
              .setDescription("add or remove")
              .setRequired(true)
              .addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }, { name: "list", value: "list" }),
          )
          .addUserOption((o) => o.setName("user").setDescription("User to whitelist").setRequired(false)),
      )
      .addSubcommand((s) =>
        s
          .setName("threshold")
          .setDescription("Set the action threshold for a specific event type")
          .addStringOption((o) =>
            o
              .setName("action")
              .setDescription("The action type to configure")
              .setRequired(true)
              .addChoices(
                { name: "channel-delete", value: "channelDelete" },
                { name: "channel-create", value: "channelCreate" },
                { name: "ban",            value: "ban" },
                { name: "kick",           value: "kick" },
                { name: "role-delete",    value: "roleDelete" },
                { name: "webhook-create", value: "webhookCreate" },
              ),
          )
          .addIntegerOption((o) =>
            o.setName("count").setDescription("Maximum actions before triggering (1–20)").setRequired(true).setMinValue(1).setMaxValue(20),
          )
          .addIntegerOption((o) =>
            o.setName("window").setDescription("Detection window in seconds (3–60)").setRequired(false).setMinValue(3).setMaxValue(60),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("punishment")
          .setDescription("Set the punishment applied when anti-nuke is triggered")
          .addStringOption((o) =>
            o
              .setName("action")
              .setDescription("Punishment type")
              .setRequired(true)
              .addChoices(
                { name: "Ban",         value: "ban" },
                { name: "Kick",        value: "kick" },
                { name: "Strip Roles", value: "strip-roles" },
              ),
          ),
      )
      .addSubcommand((s) => s.setName("status").setDescription("View current anti-nuke configuration and thresholds")),

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    // ── enable ─────────────────────────────────────────────────────────────
    if (sub === "enable") {
      const punishment = (ctx.isSlash ? ctx.interaction!.options.getString("punishment") : ctx.args[1]) ?? "strip-roles";
      const windowArg  = (ctx.isSlash ? ctx.interaction!.options.getInteger("window") : parseInt(ctx.args[2] ?? "10")) ?? 10;
      const threshArg  = (ctx.isSlash ? ctx.interaction!.options.getInteger("threshold") : parseInt(ctx.args[3] ?? "3")) ?? 3;

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        {
          $set: {
            "antinuke.enabled":     true,
            "antinuke.punishment":  punishment,
            "antinuke.windowSeconds": windowArg,
            // Apply the supplied threshold to all action types as a baseline
            "antinuke.thresholds.channelDelete":  threshArg,
            "antinuke.thresholds.channelCreate":  threshArg + 2,
            "antinuke.thresholds.ban":            threshArg,
            "antinuke.thresholds.kick":           threshArg + 2,
            "antinuke.thresholds.roleDelete":     threshArg,
            "antinuke.thresholds.webhookCreate":  threshArg,
          },
        },
        { upsert: true },
      );
      const punLabels: Record<string, string> = { ban: "🔨 Ban", kick: "👢 Kick", "strip-roles": "🎭 Strip Roles" };
      await ctx.reply({
        embeds: [
          successEmbed(
            `🛡️ Anti-nuke **enabled**.\n` +
            `Punishment: **${punLabels[punishment] ?? punishment}** | ` +
            `Base threshold: **${threshArg} actions** within **${windowArg}s**`,
          ),
        ],
      });
      return;
    }

    // ── disable ────────────────────────────────────────────────────────────
    if (sub === "disable") {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "antinuke.enabled": false } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed("🛡️ Anti-nuke has been **disabled**.")] });
      return;
    }

    // ── whitelist ──────────────────────────────────────────────────────────
    if (sub === "whitelist") {
      const action = ctx.isSlash ? ctx.interaction!.options.getString("action", true) : ctx.args[1]?.toLowerCase();

      if (action === "list") {
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const an = (cfg as any)?.antinuke ?? {};
        const users: string[] = an.whitelistUsers ?? [];
        const roles: string[] = an.whitelistRoles ?? [];
        const embed = baseEmbed("primary")
          .setTitle("🛡️ Anti-Nuke Whitelist")
          .addFields(
            { name: "Whitelisted Users", value: users.length ? users.map((id) => `<@${id}>`).join(", ") : "None", inline: false },
            { name: "Whitelisted Roles", value: roles.length ? roles.map((id) => `<@&${id}>`).join(", ") : "None", inline: false },
          );
        await ctx.reply({ embeds: [embed] });
        return;
      }

      const user = ctx.isSlash
        ? ctx.interaction!.options.getUser("user")
        : await ctx.client.users.fetch(ctx.args[2]?.replace(/\D/g, "") ?? "").catch(() => null);

      if (!user) { await ctx.reply({ embeds: [errorEmbed("Please provide a user to add or remove.")] }); return; }
      const op = action === "add" ? "$addToSet" : "$pull";
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { [op]: { "antinuke.whitelistUsers": user.id } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`<@${user.id}> has been **${action === "add" ? "added to" : "removed from"}** the anti-nuke whitelist.`)] });
      return;
    }

    // ── threshold ──────────────────────────────────────────────────────────
    if (sub === "threshold") {
      const action = ctx.isSlash ? ctx.interaction!.options.getString("action", true) : ctx.args[1];
      const count  = ctx.isSlash ? ctx.interaction!.options.getInteger("count", true)  : parseInt(ctx.args[2] ?? "3");
      const window = (ctx.isSlash ? ctx.interaction!.options.getInteger("window") : parseInt(ctx.args[3] ?? "10")) ?? 10;

      if (!THRESHOLD_ACTIONS.includes(action as ThresholdAction)) {
        await ctx.reply({ embeds: [errorEmbed("Invalid action type. Valid options: channelDelete | channelCreate | ban | kick | roleDelete | webhookCreate")] });
        return;
      }
      if (!count || count < 1) { await ctx.reply({ embeds: [errorEmbed("Provide a valid count (1–20).")] }); return; }

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { [`antinuke.thresholds.${action}`]: count, "antinuke.windowSeconds": window } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`Anti-nuke threshold for **${action}** set to **${count} actions** within **${window}s**.`)] });
      return;
    }

    // ── punishment ─────────────────────────────────────────────────────────
    if (sub === "punishment") {
      const action = ctx.isSlash ? ctx.interaction!.options.getString("action", true) : ctx.args[1];
      const valid = ["ban", "kick", "strip-roles"];
      if (!action || !valid.includes(action)) {
        await ctx.reply({ embeds: [errorEmbed("Valid punishment types: `ban` | `kick` | `strip-roles`.")] });
        return;
      }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "antinuke.punishment": action } }, { upsert: true });
      const labels: Record<string, string> = { ban: "🔨 Ban", kick: "👢 Kick", "strip-roles": "🎭 Strip Roles" };
      await ctx.reply({ embeds: [successEmbed(`Anti-nuke punishment set to **${labels[action]}**.`)] });
      return;
    }

    // ── status ─────────────────────────────────────────────────────────────
    if (sub === "status") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const an = (cfg as any)?.antinuke ?? {};
      if (!an.enabled) { await ctx.reply({ embeds: [infoEmbed("Anti-nuke is currently **disabled**.")] }); return; }

      const t = an.thresholds ?? {};
      const labels: Record<string, string> = { ban: "🔨 Ban", kick: "👢 Kick", "strip-roles": "🎭 Strip Roles" };
      const embed = baseEmbed("primary")
        .setTitle("🛡️ Anti-Nuke Status")
        .addFields(
          { name: "Enabled",    value: "✅ Yes",                  inline: true },
          { name: "Punishment", value: labels[an.punishment] ?? an.punishment ?? "strip-roles", inline: true },
          { name: "Window",     value: `${an.windowSeconds ?? 10}s`, inline: true },
          { name: "Thresholds", value:
            `Channel Delete: **${t.channelDelete ?? 3}**\n` +
            `Channel Create: **${t.channelCreate ?? 5}**\n` +
            `Role Delete: **${t.roleDelete ?? 3}**\n` +
            `Ban: **${t.ban ?? 3}**\n` +
            `Kick: **${t.kick ?? 5}**\n` +
            `Webhook Create: **${t.webhookCreate ?? 3}**`,
            inline: false,
          },
          { name: "Whitelisted Users", value: (an.whitelistUsers ?? []).length ? (an.whitelistUsers as string[]).map((id) => `<@${id}>`).join(", ") : "None", inline: false },
          { name: "Whitelisted Roles", value: (an.whitelistRoles ?? []).length ? (an.whitelistRoles as string[]).map((id) => `<@&${id}>`).join(", ") : "None", inline: false },
        );
      await ctx.reply({ embeds: [embed] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: enable | disable | whitelist | threshold | punishment | status")] });
  },
};

export default command;
