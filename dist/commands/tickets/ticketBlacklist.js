import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "ticketblacklist",
    description: "Prevent a user from creating new tickets",
    category: "Tickets",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to blacklist from tickets").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason for blacklisting").setRequired(false).setMaxLength(200)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[0]?.replace(/\D/g, "");
        const reason = ctx.isSlash ? (ctx.interaction.options.getString("reason") ?? "No reason provided") : ctx.args.slice(1).join(" ") || "No reason provided";
        if (!userId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        if (cfg?.tickets?.blacklistedUserIds?.includes(userId)) {
            await ctx.reply({ embeds: [errorEmbed("<@" + userId + "> is already blacklisted from tickets.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "tickets.blacklistedUserIds": userId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`<@${userId}> has been **blacklisted** from creating tickets.\nReason: ${reason}`)] });
    },
};
export default command;
//# sourceMappingURL=ticketBlacklist.js.map