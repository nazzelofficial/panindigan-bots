import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "welcomesetup",
  description: "Quick setup for welcome messages — set the channel and optionally a custom message",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 10,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel for welcome messages").setRequired(true))
      .addStringOption((o) => o.setName("message").setDescription("Custom welcome message (optional)").setRequired(false).setMaxLength(1000)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] }); return; }
    const msg = ctx.isSlash ? ctx.interaction!.options.getString("message") ?? null : ctx.args.slice(1).join(" ") || null;
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { "welcome.channelId": channelId, "welcome.enabled": true, ...(msg ? { "welcome.message": msg } : {}) } },
      { upsert: true },
    );
    await ctx.reply({ embeds: [successEmbed(`Welcome messages **enabled** in <#${channelId}>${msg ? " with your custom message" : " with the default message"}.`)] });
  },
};
export default command;
