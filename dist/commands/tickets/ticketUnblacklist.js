import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "ticketunblacklist",
    description: "Remove a user from the ticket blacklist, allowing them to create tickets again",
    category: "Tickets",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to remove from the ticket blacklist").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!userId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "tickets.blacklistedUserIds": userId } });
        await ctx.reply({ embeds: [successEmbed(`<@${userId}> has been **removed** from the ticket blacklist. They can now create tickets again.`)] });
    },
};
export default command;
//# sourceMappingURL=ticketUnblacklist.js.map