import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { UserModel } from "../../database/models/User.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "leaderboard",
  description: "View the XP leaderboard for this server",
  category: "Leveling",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["lb", "top"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1))
      .addStringOption((o) =>
        o.setName("type").setDescription("Leaderboard type").setRequired(false)
          .addChoices({ name: "xp", value: "xp" }, { name: "level", value: "level" }, { name: "prestige", value: "prestige" }),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const page = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : (parseInt(ctx.args[0] ?? "1") || 1));
    const type = (ctx.isSlash ? ctx.interaction!.options.getString("type") : ctx.args[1]) ?? "xp";
    const perPage = 10;
    const skip = (page - 1) * perPage;

    // Get all users who have a profile in this guild
    const allUsers = await UserModel.find({ "guilds.guildId": guild.id }).lean();
    type UserEntry = { userId: string; xp: number; level: number; prestige: number };
    const entries: UserEntry[] = allUsers
      .map((u: any) => {
        const gp = u.guilds?.find((g: any) => g.guildId === guild.id);
        return gp ? { userId: u.userId, xp: gp.xp ?? 0, level: gp.level ?? 0, prestige: gp.prestige ?? 0 } : null;
      })
      .filter(Boolean) as UserEntry[];

    entries.sort((a, b) => {
      if (type === "prestige") return b.prestige - a.prestige || b.level - a.level;
      if (type === "level") return b.level - a.level || b.xp - a.xp;
      return b.xp - a.xp;
    });

    const total = entries.length;
    const pageEntries = entries.slice(skip, skip + perPage);

    if (!pageEntries.length) {
      await ctx.reply({ embeds: [errorEmbed("No entries on this page.")] }); return;
    }

    const totalPages = Math.ceil(total / perPage);
    const userRank = entries.findIndex((e) => e.userId === ctx.userId) + 1;
    const medal = ["🥇", "🥈", "🥉"];

    const lines = await Promise.all(
      pageEntries.map(async (entry, idx) => {
        const position = skip + idx + 1;
        const prefix = position <= 3 ? medal[position - 1] : `**#${position}**`;
        let tag: string;
        try { tag = (await ctx.client.users.fetch(entry.userId)).username; } catch { tag = `<@${entry.userId}>`; }
        if (type === "prestige") return `${prefix} ${tag} — Prestige **${entry.prestige}** · Lvl **${entry.level}**`;
        if (type === "level") return `${prefix} ${tag} — Level **${entry.level}** · **${entry.xp.toLocaleString()}** XP`;
        return `${prefix} ${tag} — **${entry.xp.toLocaleString()}** XP · Lvl **${entry.level}**`;
      }),
    );

    const embed = baseEmbed("primary")
      .setTitle(`🏆 ${guild.name} — ${type.toUpperCase()} Leaderboard`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: `Page ${page}/${totalPages} · ${total} members · Your rank: #${userRank || "N/A"}` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
