import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "servers",
  description: "List all servers the bot is in or get info on a specific server (owner only)",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 10,
  aliases: ["guilds", "guildlist"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("guildid").setDescription("Get info on a specific guild").setRequired(false))
      .addIntegerOption((o) => o.setName("page").setDescription("Page (default 1)").setRequired(false).setMinValue(1)),
  async execute(ctx) {
    const guildId = ctx.isSlash ? ctx.interaction!.options.getString("guildid") : ctx.args[0];
    const page = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : parseInt(ctx.args[0] ?? "1") || 1);

    if (guildId) {
      const guild = ctx.client.guilds.cache.get(guildId);
      if (!guild) { await ctx.reply({ embeds: [errorEmbed(`Bot is not in guild \`${guildId}\`.`)] }); return; }
      const owner = await guild.fetchOwner().catch(() => null);
      const embed = baseEmbed("primary")
        .setTitle(`📋 Guild: ${guild.name}`)
        .setThumbnail(guild.iconURL() ?? null)
        .addFields(
          { name: "ID", value: guild.id, inline: true },
          { name: "Members", value: guild.memberCount.toString(), inline: true },
          { name: "Owner", value: owner ? `${owner.user.username} (${owner.id})` : guild.ownerId, inline: true },
          { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
          { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
          { name: "Boost Level", value: String(guild.premiumTier), inline: true },
        );
      await ctx.reply({ embeds: [embed] });
      return;
    }

    const guilds = [...ctx.client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
    const perPage = 10;
    const totalPages = Math.ceil(guilds.length / perPage);
    const pageGuilds = guilds.slice((page - 1) * perPage, page * perPage);

    if (!pageGuilds.length) { await ctx.reply({ embeds: [infoEmbed("No guilds on this page.")] }); return; }

    const embed = baseEmbed("primary")
      .setTitle(`📋 Servers (${guilds.length} total)`)
      .setDescription(
        pageGuilds.map((g, i) =>
          `**${(page - 1) * perPage + i + 1}.** ${g.name} \`${g.id}\` — **${g.memberCount}** members`,
        ).join("\n"),
      )
      .setFooter({ text: `Page ${page}/${totalPages}` });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
