import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { ModCaseModel } from "@/database/models/Moderation";
import { baseEmbed, errorEmbed, infoEmbed, successEmbed } from "@/utils/embeds";
import { createModCase } from "@/features/moderation/caseEngine";

const command: CommandDefinition = {
  name: "note",
  description: "Add or list moderator notes on a user",
  category: "Moderation",
  access: "moderator",
  memberPermissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("add")
          .setDescription("Add a note to a user")
          .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true))
          .addStringOption((o) => o.setName("note").setDescription("The note").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("list")
          .setDescription("List notes for a user")
          .addUserOption((o) => o.setName("user").setDescription("User").setRequired(true)),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "list";

    if (sub === "add") {
      const target = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
      const note = ctx.isSlash ? ctx.interaction!.options.getString("note", true) : ctx.args.slice(2).join(" ");
      if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      if (!note) { await ctx.reply({ embeds: [errorEmbed("Provide a note.")] }); return; }
      await createModCase({ guildId: guild.id, userId: target.id, moderatorId: ctx.userId, type: "note", reason: note });
      await ctx.reply({ embeds: [successEmbed(`📝 Note added for ${target.username}: ${note}`)] });
    } else if (sub === "list") {
      const target = ctx.isSlash ? ctx.interaction!.options.getUser("user", true) : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
      if (!target) { await ctx.reply({ embeds: [errorEmbed("User not found.")] }); return; }
      const notes = await ModCaseModel.find({ guildId: guild.id, userId: target.id, type: "note" }).sort({ createdAt: -1 }).limit(10).lean();
      if (!notes.length) { await ctx.reply({ embeds: [infoEmbed(`No notes for ${target.username}.`)] }); return; }
      const embed = baseEmbed("primary")
        .setTitle(`📝 Notes — ${target.username}`)
        .setDescription(notes.map((n: any) => `**Case #${n.caseId}** — ${n.reason}\n> By <@${n.moderatorId}> · <t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>`).join("\n\n").slice(0, 4000));
      await ctx.reply({ embeds: [embed] });
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: add | list")] });
    }
  },
};
export default command;
