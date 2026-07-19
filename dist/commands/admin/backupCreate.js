import { GuildModel } from "../../database/models/Guild";
import { successEmbed, infoEmbed } from "../../utils/embeds";
const command = {
    name: "backup_create",
    description: "Create a server configuration backup",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("💾 Creating server backup...")] });
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const backup = {
            timestamp: new Date(),
            config: config,
        };
        const bkpCh = ctx.interaction?.channel ?? ctx.message?.channel;
        await bkpCh?.send?.({
            embeds: [successEmbed(`Backup created at ${backup.timestamp.toLocaleString()}`)],
        });
    },
};
export default command;
//# sourceMappingURL=backupCreate.js.map