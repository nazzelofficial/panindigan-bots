import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "noteclear",
  description: "Clear all moderator notes for a specific user",
  category: "Moderation",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 10,
  aliases: ["clearnotes", "deletenotes"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addUserOption((o) =>
        o.setName("user").setDescription("User whose notes to clear").setRequired(true),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const targetId = ctx.isSlash
      ? ctx.interaction!.options.getUser("user", true).id
      : ctx.args[0]?.replace(/\D/g, "");

    if (!targetId) {
      await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
      return;
    }

    const count = await ModCaseModel.countDocuments({
      guildId: guild.id,
      userId: targetId,
      type: "note",
    });

    if (count === 0) {
      await ctx.reply({ embeds: [errorEmbed(`No notes found for <@${targetId}>.`)] });
      return;
    }

    await ModCaseModel.deleteMany({ guildId: guild.id, userId: targetId, type: "note" });

    await sendLogEvent(guild.id, "noteClear", () =>
      baseEmbed("warning")
        .setTitle("📝 Notes Cleared")
        .setDescription(
          `**User:** <@${targetId}>\n**Notes deleted:** ${count}\n**Cleared by:** <@${ctx.userId}>`,
        ),
    );

    await ctx.reply({
      embeds: [successEmbed(`Cleared **${count}** note${count !== 1 ? "s" : ""} for <@${targetId}>.`)],
    });
  },
};

export default command;
