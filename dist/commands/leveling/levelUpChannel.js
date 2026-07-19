import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "levelupchannel",
    description: "Set the channel where level-up announcements are sent (or use 'current' to always post in the current channel)",
    category: "Leveling",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["levelchannel"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set a specific level-up channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel for level-up messages").setRequired(true)))
        .addSubcommand((s) => s.setName("current").setDescription("Send level-up messages in the channel where the user spoke"))
        .addSubcommand((s) => s.setName("clear").setDescription("Clear the level-up channel (uses current channel)")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "current");
        if (sub === "set") {
            const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!channelId) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "leveling.announceChannelId": channelId } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Level-up messages will be sent to <#${channelId}>.`)] });
        }
        else {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "leveling.announceChannelId": "" } });
            await ctx.reply({ embeds: [successEmbed("Level-up messages will now be sent in the channel where the user is active.")] });
        }
    },
};
export default command;
//# sourceMappingURL=levelUpChannel.js.map