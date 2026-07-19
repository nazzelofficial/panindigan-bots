import { SlashCommandBuilder, GuildMember } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "userinfo",
  description: "View detailed information about a user",
  category: "Utility",
  access: "general",
  guildOnly: false,
  cooldown: 5,
  aliases: ["whois", "ui", "profile"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) => o.setName("user").setDescription("User to look up").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    const target = ctx.isSlash
      ? ctx.interaction!.options.getUser("user") ?? ctx.interaction!.user
      : ctx.args[0]
        ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
        : await ctx.client.users.fetch(ctx.userId);

    if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }

    const member = guild ? await guild.members.fetch(target.id).catch(() => null) : null;
    const createdAt = Math.floor(target.createdTimestamp / 1000);
    const joinedAt = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    const roles = member?.roles.cache
      .filter((r) => r.id !== guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString())
      .slice(0, 10) ?? [];

    const embed = baseEmbed("primary")
      .setTitle(`👤 ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 User ID", value: target.id, inline: true },
        { name: "🤖 Bot", value: target.bot ? "Yes" : "No", inline: true },
        { name: "📅 Account Created", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: false },
      );

    if (member) {
      embed.addFields(
        { name: "📅 Server Joined", value: joinedAt ? `<t:${joinedAt}:F> (<t:${joinedAt}:R>)` : "Unknown", inline: false },
        { name: "📛 Nickname", value: member.nickname ?? "None", inline: true },
        { name: "🎨 Highest Role", value: member.roles.highest.toString(), inline: true },
        { name: `🏷️ Roles (${Math.min(roles.length, 10)})`, value: roles.length ? roles.join(", ").slice(0, 1000) : "None", inline: false },
      );
      if (member.premiumSince) embed.addFields({ name: "💎 Boosting Since", value: `<t:${Math.floor(member.premiumSinceTimestamp! / 1000)}:R>`, inline: true });
    }

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
