import { successEmbed, infoEmbed } from "../../utils/embeds.js";
import { scopedLogger } from "../../utils/logger.js";
const log = scopedLogger("owner:dbbackup");
const command = {
    name: "databasebackup",
    description: "Trigger a manual database backup notification",
    category: "Owner",
    access: "owner",
    guildOnly: false,
    cooldown: 60,
    aliases: ["dbbackup"],
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("💾 Database backup initiated...")] });
        // In production, connect to your backup service or run mongodump
        // This command logs the intent — actual backup depends on your infrastructure setup
        log.info("Manual database backup triggered", { by: ctx.userId });
        // Note: ctx.reply is fire-and-forget here since we already replied above
        // Use channel.send if available for follow-up
        const ch = ctx.interaction?.channel ?? ctx.message?.channel;
        await ch?.send?.({ embeds: [successEmbed("✅ Backup request logged. Ensure your MongoDB Atlas auto-backup or mongodump pipeline is configured externally.")] }).catch(() => { });
    },
};
export default command;
//# sourceMappingURL=databaseBackup.js.map