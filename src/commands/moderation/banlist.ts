import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "banlist",
  description: "View the list of banned users in this server",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  cooldown: 10,
  aliases: ["bans", "banned"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) =>
        o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1),
      )
      .addStringOption((o) =>
        o.setName("search").setDescription("Find isang partikular na user (username/ID)").setRequired(false),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    if (ctx.isSlash) await ctx.interaction!.deferReply();

    const bans = await guild.bans.fetch().catch(() => null);
    if (!bans) { await ctx.reply({ embeds: [errorEmbed("Hindi ma-fetch ang ban list. Siguraduhing may sapat akong permission.")] }); return; }
    if (!bans.size) { await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🔨 Ban List").setDescription("No banned users in this server.")] }); return; }

    const search = ctx.isSlash ? (ctx.interaction!.options.getString("search")?.toLowerCase() ?? "") : (ctx.args[1]?.toLowerCase() ?? "");
    const filtered = search
      ? bans.filter((b) => b.user.username.toLowerCase().includes(search) || b.user.id === search)
      : bans;

    if (!filtered.size) {
      await ctx.reply({ embeds: [errorEmbed(`No banned user found matching: \`${search}\``)] });
      return;
    }

    const PER_PAGE = 15;
    const page = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : (parseInt(ctx.args[0]) || 1));
    const total = filtered.size;
    const pages = Math.ceil(total / PER_PAGE);
    const start = (page - 1) * PER_PAGE;

    const entries = [...filtered.values()].slice(start, start + PER_PAGE);

    const embed = baseEmbed("danger")
      .setTitle(`🔨 Ban List${search ? ` (Search: "${search}")` : ""}`)
      .setDescription(
        entries
          .map((b, i) => `${start + i + 1}. **${b.user.username}** (\`${b.user.id}\`)${b.reason ? `\n   └ ${b.reason.slice(0, 80)}` : ""}`)
          .join("\n"),
      )
      .setFooter({ text: `Page ${page}/${pages} · ${total} total banned user${total !== 1 ? "s" : ""}` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
