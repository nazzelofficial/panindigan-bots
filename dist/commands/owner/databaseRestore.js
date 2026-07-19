import { warnEmbed } from "../../utils/embeds";
import { scopedLogger } from "../../utils/logger";
const log = scopedLogger("owner:dbrestore");
const command = {
    name: "databaserestore",
    description: "Acknowledge a database restore request (requires manual intervention)",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 60,
    aliases: ["dbrestore"],
    slashData: (b) => b.addStringOption((o) => o.setName("backup").setDescription("Backup identifier or date to restore from").setRequired(true)),
    async execute(ctx) {
        const backup = ctx.isSlash ? ctx.interaction.options.getString("backup", true) : ctx.args.join(" ");
        log.warn("Database restore requested", { by: ctx.userId, backup });
        await ctx.reply({
            embeds: [
                warnEmbed(`⚠️ **Database Restore Requested**\n\nBackup: \`${backup}\`\nRequested by: <@${ctx.userId}>\n\n` +
                    "This is a **critical operation**. Manual restore must be performed through MongoDB Atlas or your server console. The bot cannot restore data automatically."),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=databaseRestore.js.map