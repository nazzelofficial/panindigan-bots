import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "economy_reset",
    description: "Reset a user economy data",
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
        await UserModel.updateOne({ userId: user.id }, { $pull: { guilds: { guildId: guild.id } } });
        await ctx.reply({ embeds: [successEmbed(`Reset ${user.tag}'s economy data in this server.`)] });
    },
};
export default command;
//# sourceMappingURL=economyReset.js.map