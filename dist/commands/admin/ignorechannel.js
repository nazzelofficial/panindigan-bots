import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "ignorechannel",
    description: "Ignore all bot commands in a specific channel",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["ignorech"],
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to ignore").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash
            ? ctx.interaction.options.getChannel("channel", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!channelId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        if (cfg?.ignoredChannels?.includes(channelId)) {
            await ctx.reply({ embeds: [errorEmbed(`<#${channelId}> is already being ignored.`)] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { ignoredChannels: channelId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`<#${channelId}> is now ignored — bot commands will not work there.`)] });
    },
};
export default command;
//# sourceMappingURL=ignorechannel.js.map