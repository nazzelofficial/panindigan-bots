import { PermissionFlagsBits, SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed } from "@/utils/embeds";

function fillTemplate(template: string, replacements: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}

const command: CommandDefinition = {
  name: "welcome",
  description: "Configure the welcome and goodbye message system",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("setup")
          .setDescription("Set up welcome messages")
          .addChannelOption((o) => o.setName("channel").setDescription("Welcome channel").setRequired(true))
          .addStringOption((o) => o.setName("message").setDescription("Message (use {user}, {server}, {membercount})").setRequired(false)),
      )
      .addSubcommand((s) => s.setName("test").setDescription("Test the welcome message with your account"))
      .addSubcommand((s) => s.setName("disable").setDescription("Disable welcome messages"))
      .addSubcommand((s) =>
        s
          .setName("message")
          .setDescription("Update the welcome message text")
          .addStringOption((o) => o.setName("text").setDescription("New message (use {user}, {server}, {membercount})").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("goodbye")
          .setDescription("Configure goodbye messages")
          .addChannelOption((o) => o.setName("channel").setDescription("Goodbye channel").setRequired(false))
          .addStringOption((o) => o.setName("message").setDescription("Message (use {user}, {server})").setRequired(false)),
      )
      .addSubcommand((s) => s.setName("card").setDescription("Enable/disable graphical welcome cards (Premium)").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "setup") {
      const channel = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      const msg = ctx.isSlash ? ctx.interaction!.options.getString("message") ?? "Welcome to **{server}**, {user}! You are member #{membercount}." : ctx.args.slice(2).join(" ") || "Welcome to **{server}**, {user}! You are member #{membercount}.";
      if (!(channel as any)?.isTextBased?.()) { await ctx.reply({ embeds: [errorEmbed("Provide a valid text channel.")] }); return; }
      await GuildModel.findOneAndUpdate(
        { guildId: guild.id },
        { $set: { "welcome.enabled": true, "welcome.channelId": (channel as any).id, "welcome.message": msg } },
        { upsert: true },
      );
      await ctx.reply({ embeds: [successEmbed(`Welcome messages enabled in ${channel}.`)] });
    } else if (sub === "message") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.slice(1).join(" ");
      if (!text) { await ctx.reply({ embeds: [errorEmbed("Provide a message.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.message": text } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Welcome message updated:\n> ${text}`)] });
    } else if (sub === "disable") {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.enabled": false } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed("Welcome messages disabled.")] });
    } else if (sub === "test") {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const welcomeCfg = (cfg as any)?.welcome ?? {};
      if (!welcomeCfg.channelId) { await ctx.reply({ embeds: [errorEmbed("Run `welcome setup` first.")] }); return; }

      const user = await ctx.client.users.fetch(ctx.userId);
      const text = fillTemplate(welcomeCfg.message ?? "Welcome {user}!", { user: `<@${ctx.userId}>`, server: guild.name, membercount: String(guild.memberCount), username: user.username });

      const channel = guild.channels.cache.get(welcomeCfg.channelId);
      if (!channel?.isTextBased()) { await ctx.reply({ embeds: [errorEmbed("Configured welcome channel not found.")] }); return; }

      let imageAttachment: AttachmentBuilder | null = null;
      if (welcomeCfg.cardEnabled) {
        try {
          const { createCanvas, loadImage } = await import("@napi-rs/canvas");
          const W = 700, H = 250;
          const canvas = createCanvas(W, H);
          const c = canvas.getContext("2d");
          const bg = c.createLinearGradient(0, 0, W, H);
          bg.addColorStop(0, "#2c2f33"); bg.addColorStop(1, "#23272a");
          c.fillStyle = bg; c.beginPath(); c.roundRect(0, 0, W, H, 20); c.fill();
          const avatarUrl = user.displayAvatarURL({ extension: "png", size: 128 });
          const avatarImg = await loadImage(avatarUrl).catch(() => null);
          if (avatarImg) { c.save(); c.beginPath(); c.arc(125, 125, 75, 0, Math.PI * 2); c.clip(); c.drawImage(avatarImg, 50, 50, 150, 150); c.restore(); }
          c.fillStyle = "#fff"; c.font = "bold 28px Sans"; c.fillText(`Welcome, ${user.username.slice(0, 20)}!`, 240, 100);
          c.fillStyle = "#a0a0b0"; c.font = "18px Sans"; c.fillText(`You are member #${guild.memberCount}`, 240, 140);
          c.fillStyle = "#c0c0d0"; c.font = "16px Sans"; c.fillText(guild.name.slice(0, 30), 240, 170);
          imageAttachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "welcome.png" });
        } catch { /* fallback to text */ }
      }

      const embed = baseEmbed("primary").setDescription(text).setThumbnail(user.displayAvatarURL());
      if (imageAttachment) embed.setImage("attachment://welcome.png");
      await (channel as any).send({ embeds: [embed], files: imageAttachment ? [imageAttachment] : [] });
      await ctx.reply({ embeds: [successEmbed("Test welcome message sent!")] });
    } else if (sub === "goodbye") {
      const channel = ctx.isSlash ? ctx.interaction!.options.getChannel("channel") : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      const msg = ctx.isSlash ? ctx.interaction!.options.getString("message") : ctx.args.slice(2).join(" ");
      const update: Record<string, any> = {};
      if ((channel as any)?.isTextBased?.()) update["goodbye.channelId"] = (channel as any).id;
      if (msg) update["goodbye.message"] = msg;
      update["goodbye.enabled"] = true;
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: update }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Goodbye messages configured${channel ? ` in ${channel}` : ""}.`)] });
    } else if (sub === "card") {
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.cardEnabled": enabled } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Welcome cards **${enabled ? "enabled" : "disabled"}**.`)] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: setup | message | disable | test | goodbye | card")] });
    }
  },
};

export default command;
