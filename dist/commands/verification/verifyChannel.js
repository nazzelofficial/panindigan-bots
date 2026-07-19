import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "verifychannel",
    description: "Set the channel where unverified members are sent for verification",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Verification channel").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!channelId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.channelId": channelId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Verification channel set to <#${channelId}>. Unverified members will be sent there.`)] });
    },
};
export default command;
//# sourceMappingURL=verifyChannel.js.map