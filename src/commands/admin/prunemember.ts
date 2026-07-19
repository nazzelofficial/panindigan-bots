import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "prunemember",
  description: "Kick members who have been inactive (no roles, not sent messages) for N days",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.KickMembers],
  botPermissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  cooldown: 30,
  aliases: ["prune", "prunemembers"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) =>
        o
          .setName("days")
          .setDescription("Members inactive for this many days will be kicked (1–30)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(30),
      )
      .addRoleOption((o) =>
        o
          .setName("excluderole")
          .setDescription("Exclude members with this role from pruning")
          .setRequired(false),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const days = ctx.isSlash
      ? ctx.interaction!.options.getInteger("days", true)
      : parseInt(ctx.args[0] ?? "7", 10);
    const excludeRoleId = ctx.isSlash
      ? ctx.interaction!.options.getRole("excluderole")?.id ?? null
      : ctx.args[1]?.replace(/\D/g, "") ?? null;

    if (isNaN(days) || days < 1 || days > 30) {
      await ctx.reply({ embeds: [errorEmbed("Days must be between 1 and 30.")] });
      return;
    }

    await ctx.reply({ embeds: [baseEmbed("warning").setDescription(`⏳ Pruning members inactive for ${days}+ days…`)] });

    const count = await guild.members.prune({
      days,
      dry: false,
      roles: excludeRoleId ? [excludeRoleId] : [],
      reason: `Prune by ${ctx.userId}: inactive for ${days}+ days`,
    });

    await ctx.reply({
      embeds: [
        successEmbed(
          `Pruned **${count ?? 0}** member${(count ?? 0) !== 1 ? "s" : ""} who were inactive for ${days}+ days.`,
        ),
      ],
    });
  },
};

export default command;
