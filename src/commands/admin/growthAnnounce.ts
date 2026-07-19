import { PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "growthannounce",
  description: "Send a formatted growth/milestone announcement to a channel",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 30,
  aliases: ["announce", "milestone"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send the announcement to").setRequired(true))
      .addStringOption((o) => o.setName("title").setDescription("Announcement title").setRequired(true).setMaxLength(100))
      .addStringOption((o) => o.setName("message").setDescription("Announcement message").setRequired(true).setMaxLength(2000))
      .addStringOption((o) => o.setName("color").setDescription("Embed color (hex, e.g. #FF5733)").setRequired(false).setMaxLength(7))
      .addStringOption((o) => o.setName("image_url").setDescription("Optional image URL").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const channelId = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
    if (!channelId) { await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] }); return; }
    const title = ctx.isSlash ? ctx.interaction!.options.getString("title", true) : ctx.args[1] ?? "Announcement";
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.slice(2).join(" ");
    if (!message) { await ctx.reply({ embeds: [errorEmbed("Please provide an announcement message.")] }); return; }
    const color = ctx.isSlash ? (ctx.interaction!.options.getString("color") ?? "#5865F2") : "#5865F2";
    const imageUrl = ctx.isSlash ? (ctx.interaction!.options.getString("image_url") ?? null) : null;

    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) { await ctx.reply({ embeds: [errorEmbed("That is not a text channel.")] }); return; }

    const botMember = guild.members.cache.get(ctx.client.user!.id);
    if (!botMember?.permissionsIn(channel).has(PermissionFlagsBits.SendMessages)) {
      await ctx.reply({ embeds: [errorEmbed("I don't have permission to send messages in that channel.")] }); return;
    }

    let parsedColor: number;
    try {
      parsedColor = parseInt(color.replace("#", ""), 16);
    } catch {
      parsedColor = 0x5865f2;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📣 ${title}`)
      .setDescription(message.replace("{server}", guild.name).replace("{memberCount}", guild.memberCount.toString()))
      .setColor(parsedColor)
      .setTimestamp()
      .setFooter({ text: guild.name, iconURL: guild.iconURL() ?? undefined });

    if (imageUrl) embed.setImage(imageUrl);

    await (channel as any).send({ embeds: [embed] });
    await ctx.reply({ embeds: [successEmbed(`Announcement sent to <#${channelId}>.`)], ...(ctx.isSlash ? { ephemeral: true } : {}) });
  },
};
export default command;
