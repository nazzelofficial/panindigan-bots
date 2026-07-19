import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "unignoreuser",
    description: "Allow a previously ignored user to use bot commands again",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to unignore").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const userId = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!userId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { ignoredUsers: userId } });
        await ctx.reply({ embeds: [successEmbed(`<@${userId}> can now use bot commands again.`)] });
    },
};
export default command;
//# sourceMappingURL=unignoreuser.js.map