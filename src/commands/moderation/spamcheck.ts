import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { ModCaseModel } from "@/database/models/Moderation";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "spamcheck",
  description: "Analyze if a user is a likely spammer based on recent activity and moderation history",
  category: "Moderation",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  aliases: ["isspam", "spamanalyze"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to analyze").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetId = ctx.isSlash
      ? ctx.interaction!.options.getUser("user", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!targetId) { await ctx.reply({ embeds: [errorEmbed("Provide a user to check.")] }); return; }

    const user = await ctx.client.users.fetch(targetId).catch(() => null);
    if (!user) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }

    const member = await guild.members.fetch(targetId).catch(() => null);

    // Pull last 30 days of mod cases
    const since = new Date(Date.now() - 30 * 86_400_000);
    const cases = await ModCaseModel.find({ guildId: guild.id, userId: targetId, createdAt: { $gte: since } }).lean();

    const warnCount = cases.filter((c) => c.type === "warn").length;
    const muteCount = cases.filter((c) => ["mute", "timeout"].includes(c.type)).length;
    const automodCases = cases.filter((c) => c.reason.startsWith("[Automod]")).length;

    // Account age heuristic
    const createdAt = Number(BigInt(targetId) >> 22n) + 1420070400000;
    const ageDays = Math.floor((Date.now() - createdAt) / 86_400_000);

    const suspicionPoints: string[] = [];
    if (warnCount >= 3) suspicionPoints.push(`⚠️ ${warnCount} warnings in the last 30 days`);
    if (muteCount >= 2) suspicionPoints.push(`⚠️ ${muteCount} mutes/timeouts in the last 30 days`);
    if (automodCases >= 5) suspicionPoints.push(`⚠️ Triggered automod ${automodCases} times recently`);
    if (ageDays < 7) suspicionPoints.push(`🚨 New account (${ageDays} days old)`);
    if (!user.avatar) suspicionPoints.push("⚠️ No avatar — common in spam bots");

    let verdict = "🟢 Unlikely Spammer";
    if (suspicionPoints.length >= 4) verdict = "🔴 Very Likely Spammer";
    else if (suspicionPoints.length >= 3) verdict = "🟠 Likely Spammer";
    else if (suspicionPoints.length >= 2) verdict = "🟡 Possible Spammer";

    const embed = baseEmbed(suspicionPoints.length >= 3 ? "danger" : "warning")
      .setTitle(`🔎 Spam Analysis — ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Verdict", value: verdict, inline: true },
        { name: "Account Age", value: `${ageDays} days`, inline: true },
        { name: "Server Member", value: member ? "✅ Yes" : "❌ No", inline: true },
        { name: "Warnings (30d)", value: String(warnCount), inline: true },
        { name: "Mutes (30d)", value: String(muteCount), inline: true },
        { name: "Automod Hits (30d)", value: String(automodCases), inline: true },
      );

    if (suspicionPoints.length) {
      embed.addFields({ name: "Indicators", value: suspicionPoints.join("\n"), inline: false });
    } else {
      embed.addFields({ name: "Indicators", value: "✅ No significant spam indicators found.", inline: false });
    }

    embed.setFooter({ text: "This is a heuristic analysis — manual review is still recommended." });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
