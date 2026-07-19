import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "welcomechannel",
  description: "Set the channel where welcome messages are sent when members join",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Welcome channel").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.channelId": channelId, "welcome.enabled": true } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Welcome messages will be sent to <#${channelId}>.`)] });
  },
};
export default command;
