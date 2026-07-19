import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "../../database/models/Community";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "giveawaydelete",
    description: "Delete a giveaway completely (cancels it if active)",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["gdelete"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway to delete").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] });
            return;
        }
        const result = await GiveawayModel.findOneAndDelete({ guildId: guild.id, messageId });
        if (!result) {
            await ctx.reply({ embeds: [errorEmbed("No giveaway found with that message ID.")] });
            return;
        }
        await ctx.reply({ embeds: [successEmbed(`Giveaway \`${messageId}\` deleted.`)] });
    },
};
export default command;
//# sourceMappingURL=giveawayDelete.js.map