import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "backup_list",
    description: "List all server backups",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const embed = baseEmbed("primary")
            .setTitle("💾 Server Backups")
            .setDescription("No backups available")
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=backupList.js.map