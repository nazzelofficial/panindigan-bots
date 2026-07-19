import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "goodbyetoggle",
  description: "Enable or disable goodbye messages",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["leavetoggle"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable goodbye messages").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    if (enabled && !(cfg as any)?.goodbye?.channelId) {
      await ctx.reply({ embeds: [errorEmbed("Set a goodbye channel first using `goodbyechannel` or `goodbyesetup`.")] }); return;
    }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.enabled": enabled } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Goodbye messages **${enabled ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
