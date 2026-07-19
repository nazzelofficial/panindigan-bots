import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "logsignore",
    description: "Ignore a channel, user, or role from appearing in logs",
    category: "Logging",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["logignore"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("channel").setDescription("Ignore a channel from logs")
        .addChannelOption((o) => o.setName("target").setDescription("Channel to ignore").setRequired(true)))
        .addSubcommand((s) => s.setName("user").setDescription("Ignore a user's actions from logs")
        .addUserOption((o) => o.setName("target").setDescription("User to ignore").setRequired(true)))
        .addSubcommand((s) => s.setName("role").setDescription("Ignore all actions from members with a role")
        .addRoleOption((o) => o.setName("target").setDescription("Role to ignore").setRequired(true))),
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
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "logging.ignoredChannels": id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`<#${id}> will no longer appear in logs.`)] });
        }
        else if (sub === "user") {
            const id = ctx.isSlash ? ctx.interaction.options.getUser("target", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a user.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "logging.ignoredUsers": id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`<@${id}>'s actions will no longer appear in logs.`)] });
        }
        else if (sub === "role") {
            const id = ctx.isSlash ? ctx.interaction.options.getRole("target", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "logging.ignoredRoles": id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Members with <@&${id}> will no longer appear in logs.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: channel | user | role")] });
        }
    },
};
export default command;
//# sourceMappingURL=logsIgnore.js.map