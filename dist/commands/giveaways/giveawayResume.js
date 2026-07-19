import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "giveawayresume",
    description: "Resume a paused giveaway",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["gresume"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the paused giveaway").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: false, paused: true }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No paused giveaway found with that message ID.")] });
            return;
        }
        await GiveawayModel.findOneAndUpdate({ messageId }, { $set: { paused: false } });
        await ctx.reply({ embeds: [successEmbed(`Giveaway **${giveaway.prize}** resumed. Entries are now being accepted again.`)] });
    },
};
export default command;
//# sourceMappingURL=giveawayResume.js.map