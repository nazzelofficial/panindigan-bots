import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type GuildMember,
  type TextChannel,
  type CategoryChannel,
} from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
import { TicketModel, TicketPanelModel } from "@/database/models/Tickets";
import { GuildModel } from "@/database/models/Guild";
import { sendLogEvent } from "@/features/logging/logEngine";
import { getGuildTier, getTierLimits } from "@/utils/premium";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function nextTicketNumber(guildId: string): Promise<number> {
  const doc = await GuildModel.findOneAndUpdate(
    { guildId },
    { $inc: { "tickets.nextTicketNumber": 1 } },
    { new: false, upsert: true },
  ).lean();
  return (doc as any)?.tickets?.nextTicketNumber ?? 1;
}

async function buildTranscript(channel: TextChannel): Promise<Buffer> {
  const messages: any[] = [];
  let before: string | undefined;
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (batch.size === 0) break;
    messages.push(...batch.values());
    before = batch.last()?.id;
    if (batch.size < 100) break;
  }
  messages.reverse();

  const lines = messages.map((m) => {
    const ts = new Date(m.createdTimestamp).toISOString();
    const author = `${m.author.tag} (${m.author.id})`;
    const content = m.content || (m.embeds.length ? "[embed]" : "[attachment/component]");
    return `[${ts}] ${author}: ${content}`;
  });

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Ticket Transcript – ${channel.name}</title>
<style>body{font-family:monospace;background:#2c2f33;color:#dcddde;padding:20px}
.msg{margin:4px 0;line-height:1.4}.ts{color:#72767d}.author{color:#7289da;font-weight:bold}</style>
</head><body>
<h2 style="color:#fff">Ticket Transcript – #${channel.name}</h2>
<p style="color:#72767d">Generated: ${new Date().toISOString()}</p>
<hr style="border-color:#40444b"/>
${messages
  .map((m) => {
    const ts = new Date(m.createdTimestamp).toISOString();
    const content = (m.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;") || (m.embeds.length ? "[embed]" : "[attachment]");
    return `<div class="msg"><span class="ts">[${ts}]</span> <span class="author">${m.author.tag}</span>: ${content}</div>`;
  })
  .join("\n")}
</body></html>`;

  return Buffer.from(html, "utf-8");
}

// ─── command ──────────────────────────────────────────────────────────────────

const command: CommandDefinition = {
  name: "ticket",
  description: "Ticket system management and user actions",
  category: "Tickets",
  access: "general",
  memberPermissions: [],
  botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
  cooldown: 5,
  aliases: ["tickets", "tkt"],

  slashData: (b) =>
    b
      // ── setup ──
      .addSubcommand((s) =>
        s.setName("setup").setDescription("Create a default ticket panel with a button in this channel"),
      )
      // ── panel ──
      .addSubcommandGroup((g) =>
        g
          .setName("panel")
          .setDescription("Manage ticket panels")
          .addSubcommand((s) =>
            s
              .setName("create")
              .setDescription("Create a new ticket panel (Premium)")
              .addStringOption((o) => o.setName("name").setDescription("Panel name").setRequired(true))
              .addStringOption((o) => o.setName("title").setDescription("Embed title").setRequired(false))
              .addStringOption((o) => o.setName("description").setDescription("Embed description").setRequired(false)),
          )
          .addSubcommand((s) => s.setName("list").setDescription("List all panels in this server"))
          .addSubcommand((s) =>
            s
              .setName("delete")
              .setDescription("Delete a panel (Premium)")
              .addStringOption((o) => o.setName("name").setDescription("Panel name").setRequired(true)),
          )
          .addSubcommand((s) =>
            s
              .setName("edit")
              .setDescription("Edit a panel's embed (Premium)")
              .addStringOption((o) => o.setName("name").setDescription("Panel name").setRequired(true))
              .addStringOption((o) => o.setName("title").setDescription("New title").setRequired(false))
              .addStringOption((o) => o.setName("description").setDescription("New description").setRequired(false)),
          ),
      )
      // ── ticket actions ──
      .addSubcommand((s) =>
        s
          .setName("close")
          .setDescription("Close this ticket")
          .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
      )
      .addSubcommand((s) => s.setName("reopen").setDescription("Re-open a closed ticket"))
      .addSubcommand((s) => s.setName("delete").setDescription("Delete this ticket channel permanently"))
      .addSubcommand((s) =>
        s
          .setName("rename")
          .setDescription("Rename this ticket channel")
          .addStringOption((o) => o.setName("name").setDescription("New name").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("claim").setDescription("Claim this ticket as yours"))
      .addSubcommand((s) => s.setName("unclaim").setDescription("Unclaim this ticket"))
      .addSubcommand((s) =>
        s
          .setName("transfer")
          .setDescription("Transfer ticket to another user")
          .addUserOption((o) => o.setName("user").setDescription("New owner").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("add")
          .setDescription("Add a user to this ticket")
          .addUserOption((o) => o.setName("user").setDescription("User to add").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("remove")
          .setDescription("Remove a user from this ticket")
          .addUserOption((o) => o.setName("user").setDescription("User to remove").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("priority")
          .setDescription("Set ticket priority")
          .addStringOption((o) =>
            o
              .setName("level")
              .setDescription("Priority level")
              .setRequired(true)
              .addChoices(
                { name: "Low", value: "low" },
                { name: "Medium", value: "medium" },
                { name: "High", value: "high" },
                { name: "Emergency", value: "emergency" },
              ),
          ),
      )
      .addSubcommand((s) => s.setName("transcript").setDescription("Generate and upload an HTML transcript (Premium)"))
      .addSubcommand((s) =>
        s
          .setName("rate")
          .setDescription("Rate the support you received (1-5)")
          .addIntegerOption((o) =>
            o.setName("stars").setDescription("1-5 stars").setRequired(true).setMinValue(1).setMaxValue(5),
          )
          .addStringOption((o) => o.setName("comment").setDescription("Optional comment").setRequired(false)),
      )
      .addSubcommand((s) => s.setName("stats").setDescription("View ticket stats for this server (Premium)"))
      .addSubcommand((s) =>
        s
          .setName("move")
          .setDescription("Move ticket to another category")
          .addStringOption((o) => o.setName("category").setDescription("Category ID or name").setRequired(true)),
      )
      .addSubcommand((s) => s.setName("archive").setDescription("Archive this ticket (Premium)"))
      .addSubcommand((s) => s.setName("pin").setDescription("Pin this ticket channel in the panel list"))
      .addSubcommand((s) =>
        s
          .setName("setlogs")
          .setDescription("Set the channel where ticket events are logged")
          .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true)),
      )
      .addSubcommand((s) =>
        s
          .setName("setcategory")
          .setDescription("Set the default category for new ticket channels")
          .addChannelOption((o) => o.setName("category").setDescription("Category").setRequired(true)),
      ) as any,

  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const sub = ctx.isSlash
      ? ctx.interaction!.options.getSubcommand(false)
      : ctx.args[0]?.toLowerCase();
    const subGroup = ctx.isSlash ? ctx.interaction!.options.getSubcommandGroup(false) : null;

    // resolve panel sub-commands
    const effectiveSub = subGroup === "panel" ? `panel:${sub}` : sub;

    // ── setup ──────────────────────────────────────────────────────────────────
    if (effectiveSub === "setup") {
      const member = ctx.interaction?.member ?? ctx.message?.member;
      if (!(member as GuildMember)?.permissions.has(PermissionFlagsBits.ManageGuild)) {
        await ctx.reply({ embeds: [errorEmbed("You need **Manage Server** permission to run ticket setup.")], ephemeral: true });
        return;
      }
      const channel = ctx.interaction?.channel ?? ctx.message?.channel;
      if (!channel?.isTextBased()) {
        await ctx.reply({ embeds: [errorEmbed("Run this in a text channel.")] });
        return;
      }

      // create or reuse a panel
      let panel = await TicketPanelModel.findOne({ guildId: guild.id, name: "General Support" });
      if (!panel) {
        panel = await TicketPanelModel.create({
          guildId: guild.id,
          name: "General Support",
          channelId: channel.id,
          embedTitle: "📩 Support Tickets",
          embedDescription: "Click the button below to open a support ticket. Our staff will be with you shortly!",
        });
      }

      const embed = baseEmbed("primary")
        .setTitle(panel.embedTitle)
        .setDescription(panel.embedDescription)
        .setFooter({ text: "Panindigan Ticket System" });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket:open:${panel._id.toString()}`)
          .setLabel("📩 Open a Ticket")
          .setStyle(ButtonStyle.Primary),
      );

      const sent = await (channel as TextChannel).send({ embeds: [embed], components: [row] });
      panel.messageId = sent.id;
      await panel.save();

      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "tickets.enabled": true } }, { upsert: true });

      await ctx.reply({ embeds: [successEmbed("Ticket panel created! Members can now click the button to open tickets.")], ephemeral: true });
      return;
    }

    // ── panel:create ───────────────────────────────────────────────────────────
    if (effectiveSub === "panel:create") {
      const tier = await getGuildTier(guild.id);
      const limits = getTierLimits(tier);
      const existing = await TicketPanelModel.countDocuments({ guildId: guild.id });
      if (limits.ticketPanels !== -1 && existing >= limits.ticketPanels) {
        await ctx.reply({ embeds: [errorEmbed(`You've reached the panel limit (${limits.ticketPanels}) for your tier. Upgrade to create more.`)] });
        return;
      }
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1] ?? "New Panel";
      const title = ctx.isSlash ? ctx.interaction!.options.getString("title") ?? name : ctx.args[2] ?? name;
      const desc = ctx.isSlash ? ctx.interaction!.options.getString("description") ?? "Click the button to open a ticket." : ctx.args.slice(3).join(" ") || "Click the button to open a ticket.";
      const channel = ctx.interaction?.channel ?? ctx.message?.channel;
      if (!channel?.isTextBased()) { await ctx.reply({ embeds: [errorEmbed("Use in a text channel.")] }); return; }

      const panel = await TicketPanelModel.create({
        guildId: guild.id, name, channelId: channel.id, embedTitle: title, embedDescription: desc,
      });
      const embed = baseEmbed("primary").setTitle(title).setDescription(desc).setFooter({ text: "Panindigan Ticket System" });
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`ticket:open:${panel._id.toString()}`).setLabel("📩 Open a Ticket").setStyle(ButtonStyle.Primary),
      );
      const sent = await (channel as TextChannel).send({ embeds: [embed], components: [row] });
      panel.messageId = sent.id;
      await panel.save();
      await ctx.reply({ embeds: [successEmbed(`Panel **${name}** created!`)] });
      return;
    }

    // ── panel:list ─────────────────────────────────────────────────────────────
    if (effectiveSub === "panel:list") {
      const panels = await TicketPanelModel.find({ guildId: guild.id }).lean();
      if (!panels.length) { await ctx.reply({ embeds: [infoEmbed("No panels found. Run `ticket setup` first.")] }); return; }
      const embed = baseEmbed("primary").setTitle("🎫 Ticket Panels").setDescription(
        panels.map((p, i) => `**${i + 1}.** ${p.name} — <#${p.channelId}>`).join("\n"),
      );
      await ctx.reply({ embeds: [embed] });
      return;
    }

    // ── panel:delete ──────────────────────────────────────────────────────────
    if (effectiveSub === "panel:delete") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1] ?? "";
      const panel = await TicketPanelModel.findOneAndDelete({ guildId: guild.id, name });
      if (!panel) { await ctx.reply({ embeds: [errorEmbed(`No panel named **${name}**.`)] }); return; }
      await ctx.reply({ embeds: [successEmbed(`Panel **${name}** deleted.`)] });
      return;
    }

    // ── panel:edit ────────────────────────────────────────────────────────────
    if (effectiveSub === "panel:edit") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1] ?? "";
      const panel = await TicketPanelModel.findOne({ guildId: guild.id, name });
      if (!panel) { await ctx.reply({ embeds: [errorEmbed(`No panel named **${name}**.`)] }); return; }
      const title = ctx.isSlash ? ctx.interaction!.options.getString("title") : ctx.args[2];
      const desc = ctx.isSlash ? ctx.interaction!.options.getString("description") : ctx.args.slice(3).join(" ");
      if (title) panel.embedTitle = title;
      if (desc) panel.embedDescription = desc;
      await panel.save();
      // try update the original panel message
      if (panel.messageId) {
        const ch = guild.channels.cache.get(panel.channelId) as TextChannel | undefined;
        const msg = await ch?.messages.fetch(panel.messageId).catch(() => null);
        if (msg) {
          const embed = baseEmbed("primary").setTitle(panel.embedTitle).setDescription(panel.embedDescription).setFooter({ text: "Panindigan Ticket System" });
          await msg.edit({ embeds: [embed] }).catch(() => {});
        }
      }
      await ctx.reply({ embeds: [successEmbed(`Panel **${name}** updated.`)] });
      return;
    }

    // ── Ticket-channel-scoped commands ─────────────────────────────────────────
    const channel = ctx.interaction?.channel ?? ctx.message?.channel;
    const tktDoc = channel ? await TicketModel.findOne({ channelId: channel.id }) : null;

    const requireTicket = async () => {
      if (!tktDoc) {
        await ctx.reply({ embeds: [errorEmbed("This command must be used inside a ticket channel.")] });
        return false;
      }
      return true;
    };

    // ── close ─────────────────────────────────────────────────────────────────
    if (effectiveSub === "close") {
      if (!await requireTicket()) return;
      const reason = ctx.isSlash ? ctx.interaction!.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
      tktDoc!.status = "closed";
      tktDoc!.closedBy = ctx.userId;
      tktDoc!.closedReason = reason;
      await tktDoc!.save();
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) {
        await ch.permissionOverwrites.edit(tktDoc!.openerId, { SendMessages: false }).catch(() => {});
        await ch.send({ embeds: [baseEmbed("warning").setDescription(`🔒 Ticket closed by <@${ctx.userId}>. Reason: ${reason}`)] }).catch(() => {});
      }
      const guildCfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (guildCfg?.tickets?.logChannelId) {
        await sendLogEvent(guild.id, "ticketClose", () =>
          baseEmbed("warning").setTitle("🎫 Ticket Closed").setDescription(`**Ticket #${tktDoc!.ticketNumber}** closed by <@${ctx.userId}>\nReason: ${reason}`),
        );
      }
      await ctx.reply({ embeds: [successEmbed(`Ticket #${tktDoc!.ticketNumber} closed.`)] });
      return;
    }

    // ── reopen ────────────────────────────────────────────────────────────────
    if (effectiveSub === "reopen") {
      if (!await requireTicket()) return;
      if (tktDoc!.status !== "closed") { await ctx.reply({ embeds: [errorEmbed("This ticket is not closed.")] }); return; }
      tktDoc!.status = "open";
      tktDoc!.closedBy = null;
      tktDoc!.closedReason = null;
      await tktDoc!.save();
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) {
        await ch.permissionOverwrites.edit(tktDoc!.openerId, { SendMessages: true }).catch(() => {});
        await ch.send({ embeds: [successEmbed(`Ticket re-opened by <@${ctx.userId}>.`)] }).catch(() => {});
      }
      await ctx.reply({ embeds: [successEmbed(`Ticket #${tktDoc!.ticketNumber} re-opened.`)] });
      return;
    }

    // ── delete ────────────────────────────────────────────────────────────────
    if (effectiveSub === "delete") {
      if (!await requireTicket()) return;
      await ctx.reply({ embeds: [successEmbed("Deleting ticket channel in 5 seconds…")] });
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      await tktDoc!.deleteOne();
      setTimeout(() => ch?.delete("Ticket deleted").catch(() => {}), 5000);
      return;
    }

    // ── rename ────────────────────────────────────────────────────────────────
    if (effectiveSub === "rename") {
      if (!await requireTicket()) return;
      const newName = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[1];
      if (!newName) { await ctx.reply({ embeds: [errorEmbed("Provide a new name.")] }); return; }
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      await ch?.setName(newName.toLowerCase().replace(/\s+/g, "-")).catch(() => {});
      await ctx.reply({ embeds: [successEmbed(`Ticket renamed to **${newName}**.`)] });
      return;
    }

    // ── claim ─────────────────────────────────────────────────────────────────
    if (effectiveSub === "claim") {
      if (!await requireTicket()) return;
      if (tktDoc!.claimedBy) { await ctx.reply({ embeds: [errorEmbed(`Already claimed by <@${tktDoc!.claimedBy}>.`)] }); return; }
      tktDoc!.claimedBy = ctx.userId;
      await tktDoc!.save();
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      await ch?.send({ embeds: [infoEmbed(`🙋 Ticket claimed by <@${ctx.userId}>.`)] }).catch(() => {});
      await ctx.reply({ embeds: [successEmbed("You've claimed this ticket.")] });
      return;
    }

    // ── unclaim ───────────────────────────────────────────────────────────────
    if (effectiveSub === "unclaim") {
      if (!await requireTicket()) return;
      tktDoc!.claimedBy = null;
      await tktDoc!.save();
      await ctx.reply({ embeds: [successEmbed("Ticket unclaimed.")] });
      return;
    }

    // ── transfer ──────────────────────────────────────────────────────────────
    if (effectiveSub === "transfer") {
      if (!await requireTicket()) return;
      const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await guild.members.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null).then((m) => m?.user);
      if (!targetUser) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      tktDoc!.openerId = targetUser.id;
      await tktDoc!.save();
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) {
        await ch.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true }).catch(() => {});
        await ch.send({ embeds: [infoEmbed(`Ticket transferred to <@${targetUser.id}> by <@${ctx.userId}>.`)] }).catch(() => {});
      }
      await ctx.reply({ embeds: [successEmbed(`Ticket transferred to ${targetUser.tag}.`)] });
      return;
    }

    // ── add ───────────────────────────────────────────────────────────────────
    if (effectiveSub === "add") {
      if (!await requireTicket()) return;
      const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await guild.members.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null).then((m) => m?.user);
      if (!targetUser) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) await ch.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true }).catch(() => {});
      if (!tktDoc!.participants.includes(targetUser.id)) { tktDoc!.participants.push(targetUser.id); await tktDoc!.save(); }
      await ctx.reply({ embeds: [successEmbed(`Added <@${targetUser.id}> to the ticket.`)] });
      return;
    }

    // ── remove ────────────────────────────────────────────────────────────────
    if (effectiveSub === "remove") {
      if (!await requireTicket()) return;
      const targetUser = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await guild.members.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null).then((m) => m?.user);
      if (!targetUser) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) await ch.permissionOverwrites.delete(targetUser.id).catch(() => {});
      tktDoc!.participants = tktDoc!.participants.filter((id) => id !== targetUser.id);
      await tktDoc!.save();
      await ctx.reply({ embeds: [successEmbed(`Removed <@${targetUser.id}> from the ticket.`)] });
      return;
    }

    // ── priority ──────────────────────────────────────────────────────────────
    if (effectiveSub === "priority") {
      if (!await requireTicket()) return;
      const level = (ctx.isSlash ? ctx.interaction!.options.getString("level", true) : ctx.args[1]?.toLowerCase()) as any;
      if (!["low", "medium", "high", "emergency"].includes(level)) {
        await ctx.reply({ embeds: [errorEmbed("Valid priorities: low, medium, high, emergency.")] }); return;
      }
      tktDoc!.priority = level;
      await tktDoc!.save();
      const emoji = { low: "🟢", medium: "🟡", high: "🔴", emergency: "🚨" }[level as string] ?? "⚪";
      await ctx.reply({ embeds: [successEmbed(`Ticket priority set to ${emoji} **${level}**.`)] });
      return;
    }

    // ── transcript ────────────────────────────────────────────────────────────
    if (effectiveSub === "transcript") {
      if (!await requireTicket()) return;
      if (!channel?.isTextBased()) return;
      await ctx.reply({ embeds: [infoEmbed("Generating transcript… this may take a moment.")] });
      const buf = await buildTranscript(channel as TextChannel);
      const attachment = { attachment: buf, name: `transcript-${tktDoc!.ticketNumber}.html` };
      const embed = baseEmbed("primary")
        .setTitle(`📄 Transcript — Ticket #${tktDoc!.ticketNumber}`)
        .setDescription(`Generated by <@${ctx.userId}> on ${new Date().toUTCString()}`);
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      const logGuild = await GuildModel.findOne({ guildId: guild.id }).lean();
      if (logGuild?.tickets?.logChannelId) {
        const logCh = guild.channels.cache.get(logGuild.tickets.logChannelId) as TextChannel | undefined;
        await logCh?.send({ embeds: [embed], files: [attachment] }).catch(() => {});
      }
      if (ctx.isSlash) {
        await ctx.interaction!.followUp({ embeds: [embed], files: [attachment] });
      } else {
        await (ctx.message?.channel as any)?.send({ embeds: [embed], files: [attachment] });
      }
      return;
    }

    // ── rate ──────────────────────────────────────────────────────────────────
    if (effectiveSub === "rate") {
      if (!await requireTicket()) return;
      if (tktDoc!.status !== "closed") { await ctx.reply({ embeds: [errorEmbed("You can only rate a closed ticket.")] }); return; }
      if (tktDoc!.openerId !== ctx.userId) { await ctx.reply({ embeds: [errorEmbed("Only the ticket opener can rate the support.")] }); return; }
      const stars = ctx.isSlash ? ctx.interaction!.options.getInteger("stars", true) : parseInt(ctx.args[1] ?? "0", 10);
      const comment = ctx.isSlash ? ctx.interaction!.options.getString("comment") : ctx.args.slice(2).join(" ") || null;
      if (stars < 1 || stars > 5) { await ctx.reply({ embeds: [errorEmbed("Rating must be 1-5.")] }); return; }
      tktDoc!.rating = stars;
      tktDoc!.ratingComment = comment ?? null;
      await tktDoc!.save();
      const stars_str = "⭐".repeat(stars);
      await ctx.reply({ embeds: [successEmbed(`Thanks for your rating: ${stars_str}${comment ? `\n> ${comment}` : ""}`)] });
      return;
    }

    // ── stats ─────────────────────────────────────────────────────────────────
    if (effectiveSub === "stats") {
      const total = await TicketModel.countDocuments({ guildId: guild.id });
      const open = await TicketModel.countDocuments({ guildId: guild.id, status: "open" });
      const closed = await TicketModel.countDocuments({ guildId: guild.id, status: "closed" });
      const archived = await TicketModel.countDocuments({ guildId: guild.id, status: "archived" });
      const rated = await TicketModel.find({ guildId: guild.id, rating: { $ne: null } }).lean();
      const avgRating = rated.length ? (rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) / rated.length).toFixed(2) : "N/A";
      const embed = baseEmbed("primary")
        .setTitle("🎫 Ticket Statistics")
        .addFields(
          { name: "Total Tickets", value: String(total), inline: true },
          { name: "Open", value: String(open), inline: true },
          { name: "Closed", value: String(closed), inline: true },
          { name: "Archived", value: String(archived), inline: true },
          { name: "Avg Rating", value: String(avgRating), inline: true },
        );
      await ctx.reply({ embeds: [embed] });
      return;
    }

    // ── move ──────────────────────────────────────────────────────────────────
    if (effectiveSub === "move") {
      if (!await requireTicket()) return;
      const catQuery = ctx.isSlash ? ctx.interaction!.options.getString("category", true) : ctx.args[1] ?? "";
      const category = guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && (c.id === catQuery || c.name.toLowerCase() === catQuery.toLowerCase()),
      ) as CategoryChannel | undefined;
      if (!category) { await ctx.reply({ embeds: [errorEmbed("Category not found.")] }); return; }
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      await ch?.setParent(category.id, { lockPermissions: false }).catch(() => {});
      await ctx.reply({ embeds: [successEmbed(`Ticket moved to **${category.name}**.`)] });
      return;
    }

    // ── archive ───────────────────────────────────────────────────────────────
    if (effectiveSub === "archive") {
      if (!await requireTicket()) return;
      tktDoc!.status = "archived";
      await tktDoc!.save();
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      if (ch) {
        await ch.permissionOverwrites.edit(tktDoc!.openerId, { ViewChannel: false }).catch(() => {});
        const name = ch.name.startsWith("archived-") ? ch.name : `archived-${ch.name}`;
        await ch.setName(name).catch(() => {});
        await ch.send({ embeds: [infoEmbed(`📦 Ticket archived by <@${ctx.userId}>.`)] }).catch(() => {});
      }
      await ctx.reply({ embeds: [successEmbed("Ticket archived.")] });
      return;
    }

    // ── pin ───────────────────────────────────────────────────────────────────
    if (effectiveSub === "pin") {
      if (!await requireTicket()) return;
      const ch = guild.channels.cache.get(tktDoc!.channelId) as TextChannel | undefined;
      // Pin the last message or the opener message
      const msgs = await ch?.messages.fetch({ limit: 1 }).catch(() => null);
      const lastMsg = msgs?.first();
      if (lastMsg) await lastMsg.pin().catch(() => {});
      await ctx.reply({ embeds: [successEmbed("Last message pinned in this ticket.")] });
      return;
    }

    // ── setlogs ───────────────────────────────────────────────────────────────
    if (effectiveSub === "setlogs") {
      const logCh = ctx.isSlash
        ? ctx.interaction!.options.getChannel("channel", true)
        : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!(logCh as any)?.isTextBased?.()) { await ctx.reply({ embeds: [errorEmbed("Please specify a valid text channel.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "tickets.logChannelId": (logCh as any).id } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Ticket logs will be sent to <#${(logCh as any).id}>.`)] });
      return;
    }

    // ── setcategory ───────────────────────────────────────────────────────────
    if (effectiveSub === "setcategory") {
      const catCh = ctx.isSlash
        ? ctx.interaction!.options.getChannel("category", true)
        : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!catCh || catCh.type !== ChannelType.GuildCategory) { await ctx.reply({ embeds: [errorEmbed("Please specify a valid category channel.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "tickets.categoryId": catCh.id } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`New tickets will be created under **${catCh.name}**.`)] });
      return;
    }

    // Fallback
    await ctx.reply({
      embeds: [infoEmbed(
        "**Ticket Commands:**\n`ticket setup` · `ticket panel create/list/delete/edit`\n`ticket close/reopen/delete/rename/claim/unclaim/transfer/add/remove/priority/transcript/rate/stats/move/archive/pin/setlogs/setcategory`",
      )],
    });
  },

  registerComponents(client) {
    client.componentHandlers.set("ticket", async (interaction) => {
      // Handle ticket:open:<panelId>
      const [, action, panelId] = interaction.customId.split(":");

      if (action === "open") {
        const guild = interaction.guild;
        if (!guild) return;

        const panel = await TicketPanelModel.findById(panelId).lean();
        if (!panel) {
          await interaction.reply({ content: "This ticket panel no longer exists.", ephemeral: true });
          return;
        }

        // Check if user already has an open ticket
        const existing = await TicketModel.findOne({
          guildId: guild.id,
          openerId: interaction.user.id,
          status: "open",
        });
        if (existing) {
          await interaction.reply({
            content: `You already have an open ticket: <#${existing.channelId}>`,
            ephemeral: true,
          });
          return;
        }

        const guildCfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const ticketNumber = await nextTicketNumber(guild.id);
        const channelName = `ticket-${String(ticketNumber).padStart(4, "0")}-${interaction.user.username.toLowerCase().replace(/\s/g, "")}`;

        // Permission overwrites
        const overwrites: any[] = [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: guild.members.me!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
        ];
        for (const roleId of panel.supportRoleIds ?? []) {
          overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
        }

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: guildCfg?.tickets?.categoryId ?? panel.categoryId ?? undefined,
          permissionOverwrites: overwrites,
          reason: `Ticket #${ticketNumber} opened by ${interaction.user.tag}`,
        });

        await TicketModel.create({
          guildId: guild.id,
          ticketNumber,
          channelId: ticketChannel.id,
          openerId: interaction.user.id,
          panelId: panel._id,
          participants: [interaction.user.id],
        });

        // Send welcome message in the ticket channel
        const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket:close_btn:${ticketChannel.id}`)
            .setLabel("🔒 Close Ticket")
            .setStyle(ButtonStyle.Danger),
        );
        const welcomeEmbed = baseEmbed("primary")
          .setTitle(`🎫 Ticket #${ticketNumber}`)
          .setDescription(`Hello <@${interaction.user.id}>, thanks for opening a ticket!\nSupport staff will be with you shortly.\n\nClick 🔒 to close this ticket when resolved.`);
        await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [closeRow] });

        await interaction.reply({ content: `Your ticket has been created: <#${ticketChannel.id}>`, ephemeral: true });

        if (guildCfg?.tickets?.logChannelId) {
          await sendLogEvent(guild.id, "ticketOpen", () =>
            baseEmbed("success").setTitle("🎫 Ticket Opened").setDescription(`**#${ticketNumber}** opened by <@${interaction.user.id}>\n<#${ticketChannel.id}>`),
          );
        }
        return;
      }

      if (action === "close_btn") {
        // panelId here is actually channelId
        const channelId = panelId;
        const tkt = await TicketModel.findOne({ channelId });
        if (!tkt) { await interaction.reply({ content: "Ticket not found.", ephemeral: true }); return; }
        if (tkt.status === "closed") { await interaction.reply({ content: "This ticket is already closed.", ephemeral: true }); return; }
        tkt.status = "closed";
        tkt.closedBy = interaction.user.id;
        tkt.closedReason = "Closed via button";
        await tkt.save();
        const ch = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;
        if (ch) {
          await ch.permissionOverwrites.edit(tkt.openerId, { SendMessages: false }).catch(() => {});
          await ch.send({ embeds: [baseEmbed("warning").setDescription(`🔒 Ticket closed by <@${interaction.user.id}>.`)] }).catch(() => {});
        }
        await interaction.reply({ content: "Ticket closed.", ephemeral: true });
      }
    });
  },
};

export default command;
