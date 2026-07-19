import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "logssetup",
    description: "Quick logging setup — enable logging and set the default log channel",
    category: "Logging",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["setuplogging", "logsetup"],
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Default channel for all log events").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!channelId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.enabled": true, "logging.channels.default": channelId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Logging **enabled**. All events will be sent to <#${channelId}>.\n\nTip: Use \`logschannel\` to set per-event channels, and \`logsevents\` to toggle specific events.`)] });
    },
};
export default command;
//# sourceMappingURL=logsSetup.js.map