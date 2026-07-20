import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";

const command: CommandDefinition = {
  name: "modlogsclear",
  description: "Clear all moderation case history for a specific user in this server",
  category: "Moderation",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 10,
  aliases: ["clearmodlogs", "clearcases"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) =>
        o.setName("user").setDescription("User whose mod history to clear").setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName("type")
          .setDescription("Clear only a specific type (leave empty to clear all)")
          .setRequired(false)
          .addChoices(
            { name: "warn", value: "warn" },
            { name: "mute/timeout", value: "mute" },
            { name: "kick", value: "kick" },
            { name: "ban", value: "ban" },
            { name: "note", value: "note" },
          ),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetId = ctx.isSlash
      ? ctx.interaction!.options.getUser("user", true).id
      : ctx.args[0]?.replace(/\D/g, "");
    const type = ctx.isSlash
      ? ctx.interaction!.options.getString("type") ?? null
      : ctx.args[1]?.toLowerCase() ?? null;

    if (!targetId) {
      await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
      return;
    }

    const filter: any = { guildId: guild.id, userId: targetId };
    if (type) filter.type = type;

    const count = await ModCaseModel.countDocuments(filter);
    if (count === 0) {
      await ctx.reply({ embeds: [errorEmbed(`No ${type ? `\`${type}\`` : ""} cases found for <@${targetId}>.`)] });
      return;
    }

    await ModCaseModel.deleteMany(filter);

    await sendLogEvent(guild.id, "modlogsClear", () =>
      baseEmbed("warning")
        .setTitle("🗑️ Mod Logs Cleared")
        .setDescription(
          `**User:** <@${targetId}>\n**Type cleared:** ${type ?? "All"}\n**Count:** ${count} case${count !== 1 ? "s" : ""}\n**Cleared by:** <@${ctx.userId}>`,
        ),
    );

    await ctx.reply({
      embeds: [
        successEmbed(
          `Cleared **${count}** ${type ? `\`${type}\`` : ""} case${count !== 1 ? "s" : ""} for <@${targetId}>.`,
        ),
      ],
    });
  },
};

export default command;
