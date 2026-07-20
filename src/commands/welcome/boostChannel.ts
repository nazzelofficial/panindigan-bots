import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "boostchannel",
  description: "Set the channel where server boost messages are sent",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel for boost messages").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash
      ? ctx.interaction!.options.getChannel("channel", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] }); return; }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "boostMessage.channelId": channelId, "boostMessage.enabled": true } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Boost messages will be sent to <#${channelId}>.`)] });
  },
};
export default command;
