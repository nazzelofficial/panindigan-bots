import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "covermode",
  description: "Toggle cover mode — hides non-essential bot messages to reduce clutter",
  category: "Utility",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("toggle").setDescription("Enable or disable cover mode")
          .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("status").setDescription("View current cover mode status")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "status");
    if (sub === "toggle") {
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "off";
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { coverMode: enabled } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Cover mode **${enabled ? "enabled" : "disabled"}**. ${enabled ? "Non-essential bot messages will be minimized." : "All bot messages will be shown normally."}`)] });
    } else {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const enabled = (cfg as any)?.coverMode ?? false;
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🫣 Cover Mode").addFields({ name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true })] });
    }
  },
};
export default command;
