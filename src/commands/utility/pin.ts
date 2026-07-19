import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "pin",
  description: "I-pin o i-unpin ang isang message sa channel",
  category: "Utility",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  cooldown: 5,
  aliases: ["pinmsg", "unpin"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add").setDescription("I-pin ang isang message")
          .addStringOption((o) => o.setName("messageid").setDescription("ID ng message na ipe-pin").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove").setDescription("I-unpin ang isang message")
          .addStringOption((o) => o.setName("messageid").setDescription("ID ng message na ia-unpin").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("list").setDescription("View all pinned messages sa channel")),
  async execute(ctx) {
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    if (!channel || !(channel as any).messages) { await ctx.reply({ embeds: [errorEmbed("Invalid channel.")] }); return; }

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    if (sub === "add" || sub === "remove") {
      const msgId = ctx.isSlash ? ctx.interaction!.options.getString("messageid", true) : ctx.args[1];
      if (!msgId) { await ctx.reply({ embeds: [errorEmbed("Provide a Message ID.")] }); return; }

      const msg = await (channel as any).messages.fetch(msgId).catch(() => null);
      if (!msg) { await ctx.reply({ embeds: [errorEmbed("Message not found. Make sure the ID is correct and the message is in this channel.")] }); return; }

      if (sub === "add") {
        if (msg.pinned) { await ctx.reply({ embeds: [errorEmbed("Naka-pin na ang message na iyan.")] }); return; }
        await msg.pin();
        await ctx.reply({ embeds: [successEmbed(`📌 Na-pin ang [message](${msg.url}) ni ${msg.author.username}.`)] });
      } else {
        if (!msg.pinned) { await ctx.reply({ embeds: [errorEmbed("That message is not pinned.")] }); return; }
        await msg.unpin();
        await ctx.reply({ embeds: [successEmbed(`📌 Na-unpin ang message.`)] });
      }
      return;
    }

    if (sub === "list") {
      if (ctx.isSlash) await ctx.interaction!.deferReply();
      const pins = await (channel as any).messages.fetchPinned().catch(() => null);
      if (!pins) { await ctx.reply({ embeds: [errorEmbed("Hindi ma-fetch ang pinned messages.")] }); return; }
      if (!pins.size) { await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📌 Pinned Messages").setDescription("No pinned messages in this channel.")] }); return; }

      const embed = baseEmbed("primary")
        .setTitle(`📌 Pinned Messages (${pins.size})`)
        .setDescription(
          [...pins.values()].slice(0, 10).map((m: any) =>
            `• [Message](${m.url}) ni **${m.author.username}** (<t:${Math.floor(m.createdTimestamp / 1000)}:R>)\n  *${m.content?.slice(0, 80) || "[embed/attachment]"}*`,
          ).join("\n\n"),
        );

      await ctx.reply({ embeds: [embed] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: add | remove | list")] });
  },
};

export default command;
