import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "logsunignore",
    description: "Remove a channel, user, or role from the logging ignore list",
    category: "Logging",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["logunignore"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("channel").setDescription("Stop ignoring a channel")
        .addChannelOption((o) => o.setName("target").setDescription("Channel to unignore").setRequired(true)))
        .addSubcommand((s) => s.setName("user").setDescription("Stop ignoring a user's actions")
        .addUserOption((o) => o.setName("target").setDescription("User to unignore").setRequired(true)))
        .addSubcommand((s) => s.setName("role").setDescription("Stop ignoring a role")
        .addRoleOption((o) => o.setName("target").setDescription("Role to unignore").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "channel") {
            const id = ctx.isSlash ? ctx.interaction.options.getChannel("target", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "logging.ignoredChannels": id } });
            await ctx.reply({ embeds: [successEmbed(`<#${id}> will now appear in logs again.`)] });
        }
        else if (sub === "user") {
            const id = ctx.isSlash ? ctx.interaction.options.getUser("target", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "logging.ignoredUsers": id } });
            await ctx.reply({ embeds: [successEmbed(`<@${id}>'s actions will now appear in logs again.`)] });
        }
        else if (sub === "role") {
            const id = ctx.isSlash ? ctx.interaction.options.getRole("target", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "logging.ignoredRoles": id } });
            await ctx.reply({ embeds: [successEmbed(`Members with <@&${id}> will now appear in logs again.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: channel | user | role")] });
        }
    },
};
export default command;
//# sourceMappingURL=logsUnignore.js.map