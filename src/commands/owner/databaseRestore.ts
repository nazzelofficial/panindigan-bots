import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { warnEmbed, errorEmbed } from "../../utils/embeds.js";
import { scopedLogger } from "../../utils/logger.js";

const log = scopedLogger("owner:dbrestore");

const command: CommandDefinition = {
  name: "databaserestore",
  description: "Acknowledge a database restore request (requires manual intervention)",
  category: "Owner",
  access: "owner",
  guildOnly: false,
  cooldown: 60,
  aliases: ["dbrestore"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("backup").setDescription("Backup identifier or date to restore from").setRequired(true),
    ),
  async execute(ctx) {
    const backup = ctx.isSlash ? ctx.interaction!.options.getString("backup", true) : ctx.args.join(" ");
    log.warn("Database restore requested", { by: ctx.userId, backup });
    await ctx.reply({
      embeds: [
        warnEmbed(
          `⚠️ **Database Restore Requested**\n\nBackup: \`${backup}\`\nRequested by: <@${ctx.userId}>\n\n` +
          "This is a **critical operation**. Manual restore must be performed through MongoDB Atlas or your server console. The bot cannot restore data automatically.",
        ),
      ],
    });
  },
};
export default command;
