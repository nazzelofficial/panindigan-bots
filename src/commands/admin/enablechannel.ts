import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "enablechannel",
  description: "Re-enable a command that was disabled in a specific channel",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  aliases: ["channelenable"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) =>
        o.setName("channel").setDescription("Channel to restore").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("command").setDescription("Command to re-enable (leave empty to restore all)").setRequired(false),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const channelId = ctx.isSlash
      ? ctx.interaction!.options.getChannel("channel", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    const cmdName = ctx.isSlash
      ? ctx.interaction!.options.getString("command")?.toLowerCase() ?? null
      : ctx.args[1]?.toLowerCase() ?? null;

    if (!channelId) {
      await ctx.reply({ embeds: [errorEmbed("Please provide a channel.")] });
      return;
    }

    if (cmdName) {
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $pull: { disabledChannels: { channelId, command: cmdName } } },
      );
      await ctx.reply({ embeds: [successEmbed(`\`${cmdName}\` has been re-enabled in <#${channelId}>.`)] });
    } else {
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $pull: { disabledChannels: { channelId } } },
      );
      await ctx.reply({ embeds: [successEmbed(`All command restrictions removed from <#${channelId}>.`)] });
    }
  },
};

export default command;
