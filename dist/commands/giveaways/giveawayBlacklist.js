import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "giveawayblacklist",
    description: "Blacklist or unblacklist a user from a specific giveaway",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["gblacklist"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true))
        .addUserOption((o) => o.setName("user").setDescription("User to blacklist from the giveaway").setRequired(true))
        .addBooleanOption((o) => o.setName("remove").setDescription("Set true to unblacklist the user").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        const userId = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
        const remove = ctx.isSlash ? (ctx.interaction.options.getBoolean("remove") ?? false) : ctx.args[2]?.toLowerCase() === "remove";
        if (!messageId || !userId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide message ID and user.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No giveaway found with that message ID.")] });
            return;
        }
        if (remove) {
            await GiveawayModel.findOneAndUpdate({ messageId }, { $pull: { blacklistedUserIds: userId } });
            await ctx.reply({ embeds: [successEmbed(`<@${userId}> removed from the giveaway blacklist. They can now enter.`)] });
        }
        else {
            await GiveawayModel.findOneAndUpdate({ messageId }, { $addToSet: { blacklistedUserIds: userId } });
            await ctx.reply({ embeds: [successEmbed(`<@${userId}> blacklisted from the **${giveaway.prize}** giveaway.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=giveawayBlacklist.js.map