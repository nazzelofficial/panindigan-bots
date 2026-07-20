import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { baseEmbed } from "../../utils/embeds.js";
import { JOBS } from "../../features/economy/jobs.js";

const command: CommandDefinition = {
  name: "profile",
  description: "View a user's full profile card for this server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["card", "playercard"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addUserOption((o) =>
      o.setName("user").setDescription("User na titingnan (default: ikaw)").setRequired(false),
    ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetId = ctx.isSlash
      ? (ctx.interaction!.options.getUser("user")?.id ?? ctx.userId)
      : (ctx.args[0]?.replace(/\D/g, "") || ctx.userId);

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    const member = await guild.members.fetch(targetId).catch(() => null);
    if (!member) { await ctx.reply({ embeds: [baseEmbed("danger").setDescription("Member not found in this server.")] }); return; }

    const user = await UserModel.findOneAndUpdate(
      { userId: targetId },
      { $setOnInsert: { userId: targetId } },
      { upsert: true, new: true },
    );
    const profile: any = user.guilds.find((g: any) => g.guildId === guild.id) ?? {};

    const xp: number = profile.xp ?? 0;
    const level: number = profile.level ?? 0;
    const nextXp = (level + 1) * 100;
    const balance: number = profile.balance ?? 0;
    const bank: number = profile.bank ?? 0;
    const job = profile.jobId ? JOBS.find((j) => j.id === profile.jobId) : null;

    const warnCount = await ModCaseModel.countDocuments({
      guildId: guild.id,
      userId: targetId,
      type: "warn",
      active: { $ne: false },
    });

    const roles = member.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .first(5);

    const joinedAt = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "Unknown";
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:D>`;

    const barFilled = Math.min(10, Math.round((xp / nextXp) * 10));
    const xpBar = "▓".repeat(barFilled) + "░".repeat(10 - barFilled);

    const embed = baseEmbed("primary")
      .setTitle(`👤 ${member.displayName}'s Profile`)
      .setThumbnail(member.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "📛 Username", value: member.user.username, inline: true },
        { name: "🆔 ID", value: member.id, inline: true },
        { name: "🤖 Bot", value: member.user.bot ? "Yes" : "No", inline: true },
        { name: "📅 Joined Server", value: joinedAt, inline: true },
        { name: "📅 Account Created", value: createdAt, inline: true },
        { name: "💼 Job", value: job ? job.name : "Unemployed", inline: true },
        { name: "⭐ Level", value: `**${level}** (${xp}/${nextXp} XP)\n${xpBar}`, inline: false },
        { name: "🪙 Wallet", value: balance.toLocaleString(), inline: true },
        { name: "🏦 Bank", value: bank.toLocaleString(), inline: true },
        { name: "⚠️ Warnings", value: String(warnCount), inline: true },
        { name: "💬 Messages", value: String(profile.messageCount ?? 0), inline: true },
        { name: "🔥 Daily Streak", value: String(profile.dailyStreak ?? 0), inline: true },
        { name: "🏅 Prestige", value: String(profile.prestige ?? 0), inline: true },
      );

    if (roles.length) {
      embed.addFields({ name: `🏷️ Top Roles (${member.roles.cache.size - 1})`, value: roles.map((r) => `${r}`).join(", "), inline: false });
    }

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
