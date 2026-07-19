import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "goodbyechannel",
    description: "Set the channel where goodbye messages are sent when members leave",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["leavechannel"],
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Goodbye channel").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!channelId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.channelId": channelId, "goodbye.enabled": true } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Goodbye messages will be sent to <#${channelId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=goodbyeChannel.js.map