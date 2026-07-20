import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "disablechannel",
  description: "Disable a specific command in a specific channel",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["cmdchannel", "channeldisable"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) =>
        o.setName("channel").setDescription("Channel to restrict").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("command").setDescription("Command to disable in that channel").setRequired(true),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const channelId = ctx.isSlash
      ? ctx.interaction!.options.getChannel("channel", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    const cmdName = ctx.isSlash
      ? ctx.interaction!.options.getString("command", true).toLowerCase()
      : ctx.args[1]?.toLowerCase();

    if (!channelId || !cmdName) {
      await ctx.reply({ embeds: [errorEmbed("Please provide both a channel and a command name.")] });
      return;
    }

    if (!ctx.client.commands.has(cmdName)) {
      await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` does not exist.`)] });
      return;
    }

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const already = (cfg as any)?.disabledChannels?.some(
      (d: any) => d.channelId === channelId && d.command === cmdName,
    );

    if (already) {
      await ctx.reply({ embeds: [errorEmbed(`\`${cmdName}\` is already disabled in <#${channelId}>.`)] });
      return;
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $push: { disabledChannels: { channelId, command: cmdName } } },
      { upsert: true },
    );

    await ctx.reply({ embeds: [successEmbed(`\`${cmdName}\` has been disabled in <#${channelId}>.`)] });
  },
};

export default command;
