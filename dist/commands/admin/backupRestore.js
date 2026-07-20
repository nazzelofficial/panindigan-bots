import { warnEmbed } from "../../utils/embeds.js";
const command = {
    name: "backup_restore",
    description: "Restore server from a backup",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("backup_id").setDescription("Backup ID to restore").setRequired(true)),
    async execute(ctx) {
        const backupId = ctx.isSlash ? ctx.interaction.options.getString("backup_id", true) : ctx.args[0];
        await ctx.reply({ embeds: [warnEmbed("Restore is a critical operation. Please confirm via console.")] });
    },
};
export default command;
//# sourceMappingURL=backupRestore.js.map