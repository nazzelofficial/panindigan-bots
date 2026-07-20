import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { xpForLevel } from "../../features/leveling/xpEngine.js";

const command: CommandDefinition = {
  name: "rank",
  description: "View your or another member's rank card",
  category: "Leveling",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["level", "lvl"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) => o.setName("user").setDescription("User to check (defaults to you)").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const target = ctx.isSlash
      ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user
      : ctx.args[0]
        ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
        : await ctx.client.users.fetch(ctx.userId);

    if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }

    const doc = await UserModel.findOne({ userId: target.id }).lean();
    const guildData = (doc as any)?.guilds?.find((g: any) => g.guildId === guild.id) ?? {};
    const xp: number = guildData.xp ?? 0;
    const level: number = guildData.level ?? 0;
    const prestige: number = guildData.prestige ?? 0;
    const xpForNext = xpForLevel(level + 1);
    const xpForCurrent = xpForLevel(level);
    const xpInLevel = Math.max(0, xp - xpForCurrent);
    const xpNeeded = Math.max(1, xpForNext - xpForCurrent);
    const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    // Rank position — count users in this guild with more XP
    const allUsers = await UserModel.find({ "guilds.guildId": guild.id }).lean();
    const rank = allUsers.filter((u: any) => {
      const gp = u.guilds?.find((g: any) => g.guildId === guild.id);
      return (gp?.xp ?? 0) > xp;
    }).length + 1;

    // Try to render a canvas rank card
    let attachment: AttachmentBuilder | null = null;
    try {
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const W = 700, H = 200;
      const canvas = createCanvas(W, H);
      const c = canvas.getContext("2d");

      // Background gradient
      const bg = c.createLinearGradient(0, 0, W, 0);
      bg.addColorStop(0, "#1a1a2e");
      bg.addColorStop(1, "#16213e");
      c.fillStyle = bg;
      c.beginPath();
      c.roundRect(0, 0, W, H, 20);
      c.fill();

      // Avatar
      const avatarUrl = target.displayAvatarURL({ extension: "png", size: 128 });
      const avatarImg = await loadImage(avatarUrl).catch(() => null);
      if (avatarImg) {
        c.save();
        c.beginPath();
        c.arc(100, 100, 60, 0, Math.PI * 2);
        c.closePath();
        c.clip();
        c.drawImage(avatarImg, 40, 40, 120, 120);
        c.restore();
      }

      // Username
      c.fillStyle = "#ffffff";
      c.font = "bold 22px Sans";
      c.fillText(target.username.slice(0, 22), 180, 80);

      // Prestige / level badges
      c.fillStyle = "#a0a0b0";
      c.font = "16px Sans";
      c.fillText(`Prestige ${prestige}  ·  Level ${level}  ·  Rank #${rank}`, 180, 108);

      // XP text
      c.fillStyle = "#c0c0d0";
      c.font = "14px Sans";
      c.fillText(`${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`, 180, 135);

      // Progress bar background
      c.fillStyle = "#333355";
      c.beginPath();
      c.roundRect(180, 150, 480, 20, 10);
      c.fill();

      // Progress bar fill
      const fill = c.createLinearGradient(180, 0, 660, 0);
      fill.addColorStop(0, "#7289da");
      fill.addColorStop(1, "#43b581");
      c.fillStyle = fill;
      c.beginPath();
      c.roundRect(180, 150, Math.max(20, (480 * percent) / 100), 20, 10);
      c.fill();

      // Percent label
      c.fillStyle = "#ffffff";
      c.font = "bold 12px Sans";
      c.fillText(`${percent}%`, 648, 165);

      const buffer = canvas.toBuffer("image/png");
      attachment = new AttachmentBuilder(buffer, { name: "rank.png" });
    } catch {
      // Canvas unavailable — fall back to embed
    }

    if (attachment) {
      const embed = baseEmbed("primary").setImage("attachment://rank.png").setFooter({ text: `${xp.toLocaleString()} total XP` });
      await ctx.reply({ embeds: [embed], files: [attachment] });
    } else {
      const bar = "█".repeat(Math.round(percent / 5)) + "░".repeat(20 - Math.round(percent / 5));
      const embed = baseEmbed("primary")
        .setTitle(`📊 Rank — ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "Rank", value: `#${rank}`, inline: true },
          { name: "Level", value: String(level), inline: true },
          { name: "Prestige", value: String(prestige), inline: true },
          { name: "XP Progress", value: `${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\n[${bar}] ${percent}%`, inline: false },
          { name: "Total XP", value: xp.toLocaleString(), inline: true },
        );
      await ctx.reply({ embeds: [embed] });
    }
  },
};

export default command;
