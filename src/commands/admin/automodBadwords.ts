import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "badwords",
  description: "Manage the server's bad-word filter — auto-delete messages containing blacklisted words",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["wordfilter", "automodbadwords", "blacklistedwords"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add a word to the filter")
          .addStringOption((o) =>
            o.setName("word").setDescription("Word or phrase to block").setRequired(true).setMaxLength(50),
          ),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a word from the filter")
          .addStringOption((o) =>
            o.setName("word").setDescription("Word or phrase to remove").setRequired(true),
          ),
      )
      .addSubcommand((s) =>
        s.setName("list").setDescription("View all filtered words"),
      )
      .addSubcommand((s) =>
        s.setName("clear").setDescription("Remove all filtered words at once"),
      )
      .addSubcommand((s) =>
        s.setName("enable").setDescription("Enable the bad-word filter"),
      )
      .addSubcommand((s) =>
        s.setName("disable").setDescription("Disable the bad-word filter (words are kept for later)"),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add") {
      const word = (
        ctx.isSlash ? ctx.interaction!.options.getString("word", true) : ctx.args.slice(1).join(" ")
      )?.toLowerCase().trim();

      if (!word) { await ctx.reply({ embeds: [errorEmbed("Please provide a word to add.")] }); return; }

      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const existing: string[] = (cfg as any)?.automod?.badWords ?? [];
      if (existing.includes(word)) {
        await ctx.reply({ embeds: [errorEmbed(`\`${word}\` is already in the filter.`)] });
        return;
      }
      if (existing.length >= 200) {
        await ctx.reply({ embeds: [errorEmbed("Maximum of 200 filtered words reached. Remove some first.")] });
        return;
      }

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $addToSet: { "automod.badWords": word }, $set: { "automod.enabled": true } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`\`${word}\` added to the bad-word filter.`)] });
      return;
    }

    if (sub === "remove") {
      const word = (
        ctx.isSlash ? ctx.interaction!.options.getString("word", true) : ctx.args.slice(1).join(" ")
      )?.toLowerCase().trim();

      if (!word) { await ctx.reply({ embeds: [errorEmbed("Please provide a word to remove.")] }); return; }

      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $pull: { "automod.badWords": word } },
      );
      await ctx.reply({ embeds: [successEmbed(`\`${word}\` removed from the bad-word filter.`)] });
      return;
    }

    if (sub === "list") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const words: string[] = (cfg as any)?.automod?.badWords ?? [];
      if (!words.length) {
        await ctx.reply({ embeds: [baseEmbed("info").setTitle("🚫 Bad-Word Filter").setDescription("No filtered words configured.")] });
        return;
      }
      // Redact in display for safety
      const display = words.map((w) => `||\`${w}\`||`).join(", ");
      const embed = baseEmbed("warning")
        .setTitle("🚫 Bad-Word Filter")
        .setDescription(display.length > 3800 ? display.slice(0, 3800) + "…" : display)
        .setFooter({ text: `${words.length} word${words.length !== 1 ? "s" : ""} filtered` });
      await ctx.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === "clear") {
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { "automod.badWords": [] } },
      );
      await ctx.reply({ embeds: [successEmbed("All filtered words have been cleared.")] });
      return;
    }

    if (sub === "enable" || sub === "disable") {
      const enabled = sub === "enable";
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { "automod.badWordFilterEnabled": enabled, "automod.enabled": true } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`Bad-word filter **${enabled ? "enabled" : "disabled"}**.`)] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list | clear | enable | disable")] });
  },
};

export default command;
