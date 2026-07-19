import { GuildModel } from "@/database/models/Guild";
const command = {
    name: "antinuke_whitelist_remove",
    description: "Remove user from anti-nuke whitelist",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to remove").setRequired(true)),
    async execute(ctx) {
        const user = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        if (!user)
            return;
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const config = await GuildModel.findOne({ guildId: guild.id });
        const antinukeWhitelist = config?.antinuke?.whitelistUsers || [];
        if (!antinukeWhitelist.includes(user.id)) {
            return ctx.reply({ content: "❌ User is not whitelisted" });
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "antinuke.whitelistUsers": user.id } }, { upsert: true });
        await ctx.reply({ content: `✅ Removed ${user.tag} from anti-nuke whitelist` });
    },
};
export default command;
//# sourceMappingURL=antinukeWhitelistRemove.js.map