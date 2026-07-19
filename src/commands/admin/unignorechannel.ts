import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "unignorechannel",
  description: "Re-enable bot commands in a previously ignored channel",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["unignorech"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) =>
        o.setName("channel").setDescription("Channel to unignore").setRequired(true),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const channelId = ctx.isSlash
      ? ctx.interaction!.options.getChannel("channel", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!channelId) {
      await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
      return;
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $pull: { ignoredChannels: channelId } },
    );

    await ctx.reply({ embeds: [successEmbed(`<#${channelId}> is no longer ignored — bot commands are now allowed there.`)] });
  },
};

export default command;
