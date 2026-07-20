import { GuildModel } from "../../database/models/Guild.js";
const command = {
    name: "config_reset",
    description: "Reset server configuration to defaults",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndDelete({ guildId: guild.id });
        await ctx.reply({ content: "✅ Server configuration reset to defaults" });
    },
};
export default command;
//# sourceMappingURL=configReset.js.map