import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed } from "../../utils/embeds.js";
const ALL_EVENTS = [
    "messageDelete", "messageUpdate", "memberJoin", "memberLeave", "memberUpdate",
    "banAdd", "banRemove", "roleCreate", "roleDelete", "roleUpdate",
    "channelCreate", "channelDelete", "channelUpdate", "voiceJoin", "voiceLeave",
    "warn", "kick", "ban", "mute", "timeout", "modcase",
];
const command = {
    name: "logs",
    description: "Configure the server logging system",
    category: "Logging",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup")
        .setDescription("Set the logging channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel for logs").setRequired(true)))
        .addSubcommand((s) => s.setName("enable").setDescription("Enable all logging"))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable all logging"))
        .addSubcommand((s) => s.setName("toggle")
        .setDescription("Toggle a specific log event on or off")
        .addStringOption((o) => o.setName("event").setDescription(`Event name`).setRequired(true)
        .addChoices(...ALL_EVENTS.map((e) => ({ name: e, value: e })))))
        .addSubcommand((s) => s.setName("view").setDescription("View current logging configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        if (sub === "setup") {
            const channel = ctx.isSlash
                ? ctx.interaction.options.getChannel("channel", true)
                : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!channel?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid text channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.channelId": channel.id, "logging.enabled": true, "logging.disabledEvents": [] } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Logging channel set to ${channel}. All events are now enabled.`)] });
        }
        else if (sub === "enable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.enabled": true, "logging.disabledEvents": [] } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("All logging events enabled.")] });
        }
        else if (sub === "disable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.enabled": false } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("Logging disabled.")] });
        }
        else if (sub === "toggle") {
            const event = ctx.isSlash ? ctx.interaction.options.getString("event", true) : ctx.args[1];
            if (!event || !ALL_EVENTS.includes(event)) {
                await ctx.reply({ embeds: [errorEmbed(`Unknown event. Valid events: ${ALL_EVENTS.join(", ")}`)] });
                return;
            }
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const disabled = cfg?.logging?.disabledEvents ?? [];
            if (disabled.includes(event)) {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "logging.disabledEvents": event } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`✅ Event **${event}** is now **enabled** in logs.`)] });
            }
            else {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "logging.disabledEvents": event } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`❌ Event **${event}** is now **disabled** in logs.`)] });
            }
        }
        else if (sub === "view") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const logging = cfg?.logging ?? {};
            const disabled = logging.disabledEvents ?? [];
            const enabled = ALL_EVENTS.filter((e) => !disabled.includes(e));
            const channelId = logging.channelId;
            const embed = baseEmbed("primary")
                .setTitle("📋 Logging Configuration")
                .addFields({ name: "Channel", value: channelId ? `<#${channelId}>` : "Not set", inline: true }, { name: "Overall Status", value: logging.enabled !== false ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: `✅ Active Events (${enabled.length})`, value: enabled.join(", ") || "None", inline: false }, { name: `❌ Disabled Events (${disabled.length})`, value: disabled.join(", ") || "None", inline: false });
            await ctx.reply({ embeds: [embed] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | enable | disable | toggle | view")] });
        }
    },
};
export default command;
//# sourceMappingURL=logs.js.map