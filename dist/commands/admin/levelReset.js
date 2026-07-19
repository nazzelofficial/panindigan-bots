import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "level_reset",
    description: "Reset a user level",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to reset").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        await UserModel.updateOne({ userId: user.id, "guilds.guildId": guild.id }, { $set: { "guilds.$.xp": 0, "guilds.$.level": 0, "guilds.$.prestige": 0 } });
        await ctx.reply({ embeds: [successEmbed(`Reset ${user.tag}'s leveling data in this server.`)] });
    },
};
export default command;
//# sourceMappingURL=levelReset.js.map