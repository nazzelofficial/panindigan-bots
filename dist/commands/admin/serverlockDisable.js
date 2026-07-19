import { GuildModel } from "@/database/models/Guild";
import { successEmbed } from "@/utils/embeds";
const command = {
    name: "serverlock_disable",
    description: "Disable server lockdown",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { locked: false, lockedReason: null }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Server lockdown disabled")] });
    },
};
export default command;
//# sourceMappingURL=serverlockDisable.js.map