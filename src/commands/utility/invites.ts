import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, errorEmbed, successEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "invites",
  description: "View server invite codes or create a new invite",
  category: "Utility",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  aliases: ["invite", "listinvites"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) => s.setName("list").setDescription("View all active server invites"))
      .addSubcommand((s) =>
        s.setName("create").setDescription("Create bagong invite link")
          .addChannelOption((o) => o.setName("channel").setDescription("Channel para sa invite (default: ito)").setRequired(false))
          .addIntegerOption((o) =>
            o.setName("expires").setDescription("Expires in (seconds, 0 = never)").setRequired(false)
              .addChoices(
                { name: "1 hour", value: 3600 },
                { name: "6 hours", value: 21600 },
                { name: "12 hours", value: 43200 },
                { name: "1 day", value: 86400 },
                { name: "7 days", value: 604800 },
                { name: "Never", value: 0 },
              ),
          )
          .addIntegerOption((o) => o.setName("maxuses").setDescription("Max gamit (0=unlimited)").setRequired(false).setMinValue(0).setMaxValue(100)),
      )
      .addSubcommand((s) =>
        s.setName("top").setDescription("View mga miyembro na may pinakamaraming na-invite")
      )
      .addSubcommand((s) =>
        s.setName("delete").setDescription("Burahin ang isang invite code (requires Manage Guild)")
          .addStringOption((o) => o.setName("code").setDescription("Invite code").setRequired(true)),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "list");

    if (sub === "list") {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await ctx.reply({ embeds: [errorEmbed("Kailangan ko ng **Manage Guild** permission para makita ang invites.")] }); return;
      }
      if (ctx.isSlash) await ctx.interaction!.deferReply();
      const invites = await guild.invites.fetch().catch(() => null);
      if (!invites) { await ctx.reply({ embeds: [errorEmbed("Hindi ma-fetch ang invites.")] }); return; }
      if (!invites.size) { await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📨 Server Invites").setDescription("No active invites.")] }); return; }

      const sorted = [...invites.values()].sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0)).slice(0, 20);
      const embed = baseEmbed("primary")
        .setTitle(`📨 Server Invites (${invites.size})`)
        .setDescription(
          sorted.map((inv) => {
            const expiry = inv.expiresTimestamp ? `<t:${Math.floor(inv.expiresTimestamp / 1000)}:R>` : "Never";
            return `**${inv.code}** — ${inv.uses ?? 0}/${inv.maxUses || "∞"} uses · by <@${inv.inviterId}> · Expires: ${expiry}`;
          }).join("\n"),
        );
      await ctx.reply({ embeds: [embed] });
      return;
    }

    if (sub === "create") {
      const chOpt = ctx.isSlash ? ctx.interaction!.options.getChannel("channel") : null;
      const channel = chOpt ? guild.channels.cache.get((chOpt as any).id) : (ctx.interaction?.channel ?? ctx.message?.channel);
      if (!channel) { await ctx.reply({ embeds: [errorEmbed("Channel not found.")] }); return; }

      const maxAge = (ctx.isSlash ? ctx.interaction!.options.getInteger("expires") : null) ?? 86400;
      const maxUses = (ctx.isSlash ? ctx.interaction!.options.getInteger("maxuses") : null) ?? 0;

      const invite = await (channel as any).createInvite({ maxAge, maxUses, reason: `Created by ${ctx.userId}` }).catch(() => null);
      if (!invite) { await ctx.reply({ embeds: [errorEmbed("Hindi magawa ang invite. Siguraduhing may Create Invite permission ako sa channel.")] }); return; }

      await ctx.reply({ embeds: [successEmbed(`✅ Invite created!\n**Link:** discord.gg/${invite.code}\n**Expires:** ${maxAge ? `<t:${Math.floor((Date.now() + maxAge * 1000) / 1000)}:R>` : "Never"}\n**Max Uses:** ${maxUses || "Unlimited"}`)] });
      return;
    }

    if (sub === "top") {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await ctx.reply({ embeds: [errorEmbed("Kailangan ko ng **Manage Guild** permission.")] }); return;
      }
      if (ctx.isSlash) await ctx.interaction!.deferReply();
      const invites = await guild.invites.fetch().catch(() => null);
      if (!invites?.size) { await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📨 Top Inviters").setDescription("No invite data available.")] }); return; }

      const inviters = new Map<string, number>();
      for (const inv of invites.values()) {
        if (inv.inviterId) inviters.set(inv.inviterId, (inviters.get(inv.inviterId) ?? 0) + (inv.uses ?? 0));
      }

      const sorted = [...inviters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      await ctx.reply({
        embeds: [
          baseEmbed("primary")
            .setTitle("🏆 Top Inviters")
            .setDescription(sorted.map(([id, uses], i) => `${i + 1}. <@${id}> — **${uses}** invite${uses !== 1 ? "s" : ""}`).join("\n") || "No data."),
        ],
      });
      return;
    }

    if (sub === "delete") {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await ctx.reply({ embeds: [errorEmbed("Kailangan ko ng **Manage Guild** permission.")] }); return;
      }
      const code = ctx.isSlash ? ctx.interaction!.options.getString("code", true) : ctx.args[1];
      if (!code) { await ctx.reply({ embeds: [errorEmbed("Provide a invite code.")] }); return; }
      await guild.invites.delete(code.replace("discord.gg/", "").trim()).catch(() => null);
      await ctx.reply({ embeds: [successEmbed(`Invite \`${code}\` ay na-delete.`)] });
      return;
    }

    await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: list | create | top | delete")] });
  },
};

export default command;
