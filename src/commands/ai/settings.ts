import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";

export default {
  name: "aisettings",
  description: "View or configure AI settings for this server",
  category: "AI",
  access: "admin",
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("view").setDescription("View current AI settings for this server"),
      )
      .addSubcommand((s) =>
        s
          .setName("toggle")
          .setDescription("Enable or disable AI features for this server")
          .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("limit")
          .setDescription("Set the daily AI message limit per user")
          .addIntegerOption((o) =>
            o.setName("limit").setDescription("Messages per day (0 = unlimited)").setRequired(true).setMinValue(0).setMaxValue(500),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("channel")
          .setDescription("Restrict AI commands to a specific channel (or remove restriction)")
          .addChannelOption((o) =>
            o.setName("channel").setDescription("Channel to restrict AI to (leave empty to allow everywhere)").setRequired(false),
          ),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0];

    if (sub === "view") {
      const doc = await GuildModel.findOne({ guildId: guild.id }).lean() as any;
      const ai = doc?.ai ?? {};

      const embed = new EmbedBuilder()
        .setTitle("🤖 AI Settings")
        .setColor("#5865F2")
        .addFields(
          { name: "Status",          value: ai.enabled !== false ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Daily Limit",     value: ai.dailyLimit != null ? `${ai.dailyLimit} messages/user` : "Unlimited", inline: true },
          { name: "Channel Lock",    value: ai.channelId ? `<#${ai.channelId}>` : "All channels", inline: true },
          { name: "Provider",        value: "OpenAI GPT-4o", inline: true },
          { name: "Context Window",  value: "10 messages", inline: true },
          { name: "Premium Feature", value: ai.premiumOnly ? "Yes — Premium servers only" : "No — All servers", inline: true },
        )
        .setFooter({ text: "Use /aisettings toggle | limit | channel to configure" })
        .setTimestamp();

      await ctx.reply({ embeds: [embed] });
      return;
    }

    if (sub === "toggle") {
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { "ai.enabled": enabled } },
        { upsert: true },
      );
      await ctx.reply({ content: `✅ AI features **${enabled ? "enabled" : "disabled"}** for this server.` });
      return;
    }

    if (sub === "limit") {
      const limit = ctx.isSlash ? ctx.interaction!.options.getInteger("limit", true) : parseInt(ctx.args[1] ?? "0", 10);
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { "ai.dailyLimit": limit } },
        { upsert: true },
      );
      await ctx.reply({ content: `✅ Daily AI message limit set to **${limit === 0 ? "unlimited" : limit + " messages/user"}**.` });
      return;
    }

    if (sub === "channel") {
      const channel = ctx.isSlash ? ctx.interaction!.options.getChannel("channel") : null;
      if (channel) {
        await GuildModel.findOneAndUpdate(
          { guildId: guild.id },
          { $set: { "ai.channelId": channel.id } },
          { upsert: true },
        );
        await ctx.reply({ content: `✅ AI commands are now restricted to <#${channel.id}>.` });
      } else {
        await GuildModel.findOneAndUpdate(
          { guildId: guild.id },
          { $unset: { "ai.channelId": 1 } },
        );
        await ctx.reply({ content: "✅ AI commands are now allowed in **all channels**." });
      }
      return;
    }

    await ctx.reply({ content: "Use: view | toggle | limit | channel" });
  },
} satisfies CommandDefinition;
