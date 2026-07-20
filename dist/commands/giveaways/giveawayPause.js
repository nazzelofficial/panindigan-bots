import { PermissionFlagsBits } from "discord.js";
import { GiveawayModel } from "../../database/models/Community.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "giveawaypause",
    description: "Pause an active giveaway (no new entries will be accepted)",
    category: "Giveaways",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["gpause"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the giveaway").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the giveaway message ID.")] });
            return;
        }
        const giveaway = await GiveawayModel.findOne({ guildId: guild.id, messageId, ended: false }).lean();
        if (!giveaway) {
            await ctx.reply({ embeds: [errorEmbed("No active giveaway found with that message ID.")] });
            return;
        }
        if (giveaway.paused) {
            await ctx.reply({ embeds: [errorEmbed("That giveaway is already paused.")] });
            return;
        }
        await GiveawayModel.findOneAndUpdate({ messageId }, { $set: { paused: true } });
        await ctx.reply({ embeds: [successEmbed(`Giveaway **${giveaway.prize}** paused. No new entries will be accepted until resumed.`)] });
    },
};
export default command;
//# sourceMappingURL=giveawayPause.js.map