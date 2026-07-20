import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

function accountAgeDays(userId: string): number {
  const createdAt = Number(BigInt(userId) >> 22n) + 1420070400000;
  return Math.floor((Date.now() - createdAt) / 86_400_000);
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase(), lb = b.toLowerCase();
  if (la === lb) return 1;
  let matches = 0;
  const longer = la.length > lb.length ? la : lb;
  const shorter = la.length > lb.length ? lb : la;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

const command: CommandDefinition = {
  name: "similaraccounts",
  description: "Find members with similar usernames or join patterns to a target user (alt detection)",
  category: "Moderation",
  access: "moderator",
  guildOnly: true,
  cooldown: 10,
  aliases: ["finddupes", "findalts"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to compare against").setRequired(true))
      .addNumberOption((o) => o.setName("similarity").setDescription("Minimum similarity threshold (0.0-1.0, default 0.6)").setRequired(false).setMinValue(0.1).setMaxValue(1.0)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetId = ctx.isSlash
      ? ctx.interaction!.options.getUser("user", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    const threshold = ctx.isSlash ? (ctx.interaction!.options.getNumber("similarity") ?? 0.6) : 0.6;

    if (!targetId) { await ctx.reply({ embeds: [errorEmbed("Provide a user to compare against.")] }); return; }

    const targetUser = await ctx.client.users.fetch(targetId).catch(() => null);
    if (!targetUser) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }

    const members = await guild.members.fetch().catch(() => null);
    if (!members) { await ctx.reply({ embeds: [errorEmbed("Failed to fetch member list.")] }); return; }

    const targetAge = accountAgeDays(targetId);
    const targetMember = guild.members.cache.get(targetId);
    const targetJoin = targetMember?.joinedAt?.getTime() ?? 0;

    const similar: Array<{ member: any; reason: string; score: number }> = [];

    for (const [id, member] of members) {
      if (id === targetId) continue;

      const reasons: string[] = [];
      let score = 0;

      const nameSim = similarity(targetUser.username, member.user.username);
      if (nameSim >= threshold) {
        reasons.push(`Username similarity: ${Math.round(nameSim * 100)}%`);
        score += nameSim;
      }

      const age = accountAgeDays(id);
      const ageDiff = Math.abs(targetAge - age);
      if (ageDiff <= 3 && targetAge < 30) {
        reasons.push(`Account age within 3 days (${age} vs ${targetAge} days)`);
        score += 0.3;
      }

      if (targetJoin && member.joinedAt) {
        const joinDiff = Math.abs(targetJoin - member.joinedAt.getTime());
        if (joinDiff < 30 * 60_000) {
          reasons.push(`Joined server within 30 minutes of each other`);
          score += 0.4;
        }
      }

      if (!member.user.avatar && !targetUser.avatar) {
        reasons.push("Both have no avatar");
        score += 0.1;
      }

      if (reasons.length) {
        similar.push({ member, reason: reasons.join(" · "), score });
      }
    }

    similar.sort((a, b) => b.score - a.score);
    const top = similar.slice(0, 10);

    if (!top.length) { await ctx.reply({ embeds: [infoEmbed(`No members found with similar patterns to **${targetUser.username}** at threshold ${threshold}.`)] }); return; }

    const embed = baseEmbed("warning")
      .setTitle(`🔍 Similar Accounts — ${targetUser.username}`)
      .setDescription(
        top.map((s, i) => `**${i + 1}.** <@${s.member.id}> (\`${s.member.user.username}\`)\n↳ ${s.reason}`).join("\n\n").slice(0, 4000),
      )
      .setFooter({ text: `Found ${top.length} similar account${top.length !== 1 ? "s" : ""} · Threshold: ${threshold}` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
