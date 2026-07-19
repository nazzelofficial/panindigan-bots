import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "antinuke_enable",
    description: "Enable anti-nuke protection",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { antinuke: { ...((await GuildModel.findOne({ guildId: guild.id }))?.antinuke || {}), enabled: true } }, { upsert: true });
        await ctx.reply({ content: "✅ Anti-nuke protection enabled" });
    },
};
export default command;
//# sourceMappingURL=antinukeEnable.js.map