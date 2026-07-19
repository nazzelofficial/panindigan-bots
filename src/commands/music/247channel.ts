import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "247channel",
  description: "⭐ Set the voice channel the bot stays in for 24/7 mode",
  category: "Music",
  access: "admin",
  premium: true,
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Voice channel for 24/7 mode").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a voice channel.")] }); return; }
    const ch = guild.channels.cache.get(channelId);
    if (!ch?.isVoiceBased()) { await ctx.reply({ embeds: [errorEmbed("That is not a voice channel.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "music.channelId247": channelId } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`24/7 channel set to **${ch.name}**. The bot will stay in this channel when 24/7 mode is active.`)] });
  },
};
export default command;
