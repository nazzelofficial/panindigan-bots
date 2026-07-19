import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "ignoredchannels",
  description: "List all channels where bot commands are ignored",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["ignoredch", "ignorelist"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const ignored: string[] = (cfg as any)?.ignoredChannels ?? [];

    if (!ignored.length) {
      await ctx.reply({ embeds: [infoEmbed("No channels are currently ignored.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("🔇 Ignored Channels")
      .setDescription(ignored.map((id) => `<#${id}>`).join("\n"))
      .setFooter({ text: `${ignored.length} channel${ignored.length !== 1 ? "s" : ""} ignored` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
