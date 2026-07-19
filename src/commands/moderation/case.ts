import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { ModCaseModel } from "@/database/models/Moderation";
import { baseEmbed, errorEmbed, infoEmbed, successEmbed } from "@/utils/embeds";

const MOD_TYPE_EMOJIS: Record<string, string> = {
  warn: "⚠️", kick: "👢", ban: "🔨", tempban: "⏱️", unban: "✅",
  mute: "🔇", timeout: "⏱️", softban: "🧹", note: "📝",
};

const command: CommandDefinition = {
  name: "case",
  description: "View, edit, or delete a moderation case",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("view")
          .setDescription("View a case by case number")
          .addIntegerOption((o) => o.setName("number").setDescription("Case number").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("edit")
          .setDescription("Edit the reason of a case")
          .addIntegerOption((o) => o.setName("number").setDescription("Case number").setRequired(true))
          .addStringOption((o) => o.setName("reason").setDescription("New reason").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("delete")
          .setDescription("Delete a case")
          .addIntegerOption((o) => o.setName("number").setDescription("Case number").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("history")
          .setDescription("View moderation history for a user")
          .addUserOption((o) => o.setName("user").setDescription("User to view").setRequired(true))
          .addIntegerOption((o) => o.setName("page").setDescription("Page").setRequired(false).setMinValue(1)),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";

    if (sub === "view") {
      const caseNum = ctx.isSlash ? ctx.interaction!.options.getInteger("number", true) : parseInt(ctx.args[1] ?? "0");
      const modCase = await ModCaseModel.findOne({ guildId: guild.id, caseId: caseNum }).lean();
      if (!modCase) { await ctx.reply({ embeds: [errorEmbed(`Case #${caseNum} not found.`)] }); return; }
      const emoji = MOD_TYPE_EMOJIS[(modCase as any).type] ?? "📋";
      const embed = baseEmbed("primary")
        .setTitle(`${emoji} Case #${caseNum} — ${(modCase as any).type.toUpperCase()}`)
        .addFields(
          { name: "User", value: `<@${(modCase as any).userId}>`, inline: true },
          { name: "Moderator", value: `<@${(modCase as any).moderatorId}>`, inline: true },
          { name: "Active", value: (modCase as any).active ? "✅" : "❌", inline: true },
          { name: "Reason", value: (modCase as any).reason ?? "No reason", inline: false },
          { name: "Created", value: `<t:${Math.floor(new Date((modCase as any).createdAt).getTime() / 1000)}:F>`, inline: true },
        );
      if ((modCase as any).expiresAt) embed.addFields({ name: "Expires", value: `<t:${Math.floor(new Date((modCase as any).expiresAt).getTime() / 1000)}:R>`, inline: true });
      await ctx.reply({ embeds: [embed] });
    } else if (sub === "edit") {
      const caseNum = ctx.isSlash ? ctx.interaction!.options.getInteger("number", true) : parseInt(ctx.args[1] ?? "0");
      const reason = ctx.isSlash ? ctx.interaction!.options.getString("reason", true) : ctx.args.slice(2).join(" ");
      const updated = await ModCaseModel.findOneAndUpdate({ guildId: guild.id, caseId: caseNum }, { $set: { reason } }, { new: true });
      if (!updated) { await ctx.reply({ embeds: [errorEmbed(`Case #${caseNum} not found.`)] }); return; }
      await ctx.reply({ embeds: [successEmbed(`Case #${caseNum} reason updated: ${reason}`)] });
    } else if (sub === "delete") {
      const caseNum = ctx.isSlash ? ctx.interaction!.options.getInteger("number", true) : parseInt(ctx.args[1] ?? "0");
      const deleted = await ModCaseModel.findOneAndDelete({ guildId: guild.id, caseId: caseNum });
      if (!deleted) { await ctx.reply({ embeds: [errorEmbed(`Case #${caseNum} not found.`)] }); return; }
      await ctx.reply({ embeds: [successEmbed(`Case #${caseNum} deleted.`)] });
    } else if (sub === "history") {
      const target = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
      if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      const page = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : parseInt(ctx.args[2] ?? "1") || 1);
      const perPage = 8;
      const total = await ModCaseModel.countDocuments({ guildId: guild.id, userId: target.id });
      const cases = await ModCaseModel.find({ guildId: guild.id, userId: target.id })
        .sort({ caseNumber: -1 }).skip((page - 1) * perPage).limit(perPage).lean();

      if (!cases.length) { await ctx.reply({ embeds: [infoEmbed(`No moderation history for ${target.username}.`)] }); return; }
      const embed = baseEmbed("primary")
        .setTitle(`📋 Moderation History — ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .setDescription(
          cases.map((c: any) => `${MOD_TYPE_EMOJIS[c.type] ?? "📋"} **Case #${c.caseId}** — ${c.type.toUpperCase()}\n> ${c.reason ?? "No reason"} — <@${c.moderatorId}> · <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>${c.active ? "" : " *(inactive)*"}`).join("\n\n"),
        )
        .setFooter({ text: `${total} total cases · Page ${page}/${Math.ceil(total / perPage)}` });
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: view | edit | delete | history")] });
    }
  },
};
export default command;
