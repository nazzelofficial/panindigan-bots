import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
function parseDuration(str) {
    const match = str.match(/^(\d+)(m|h|d)$/i);
    if (!match)
        return null;
    const n = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "m")
        return n * 60_000;
    if (unit === "h")
        return n * 3_600_000;
    if (unit === "d")
        return n * 86_400_000;
    return null;
}
const command = {
    name: "xpboost",
    description: "Start or stop a temporary XP multiplier event for the server",
    category: "Admin",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["xpevent", "doublexp"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("start")
        .setDescription("Start an XP boost event")
        .addNumberOption((o) => o.setName("multiplier").setDescription("XP multiplier (e.g. 2 = double XP)").setRequired(true).setMinValue(1.1).setMaxValue(10))
        .addStringOption((o) => o.setName("duration").setDescription("Duration (e.g. 1h, 2h, 1d)").setRequired(true)))
        .addSubcommand((s) => s.setName("stop").setDescription("Stop the currently active XP boost event"))
        .addSubcommand((s) => s.setName("status").setDescription("Check current XP boost event status")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "start") {
            const multiplier = ctx.isSlash ? ctx.interaction.options.getNumber("multiplier", true) : parseFloat(ctx.args[1]) || 2;
            const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[2] ?? "1h";
            const ms = parseDuration(durationStr);
            if (!ms) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Use `1h`, `30m`, `2d`, etc.")] });
                return;
            }
            const expiresAt = new Date(Date.now() + ms);
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
                $set: {
                    "xpBoostEvent.active": true,
                    "xpBoostEvent.multiplier": multiplier,
                    "xpBoostEvent.expiresAt": expiresAt,
                    "xpBoostEvent.startedBy": ctx.userId,
                },
            }, { upsert: true });
            await ctx.reply({
                embeds: [
                    successEmbed(`⚡ **${multiplier}x XP Boost Event** started!\nMembers will earn **${multiplier}x** XP for every message until <t:${Math.floor(expiresAt.getTime() / 1000)}:F>.`),
                ],
            });
        }
        else if (sub === "stop") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            if (!doc?.xpBoostEvent?.active) {
                await ctx.reply({ embeds: [infoEmbed("No active XP boost event.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "xpBoostEvent.active": false } });
            await ctx.reply({ embeds: [successEmbed("XP boost event stopped. Server is back to normal XP rates.")] });
        }
        else if (sub === "status") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const event = doc?.xpBoostEvent;
            if (!event?.active || (event.expiresAt && new Date(event.expiresAt) < new Date())) {
                await ctx.reply({ embeds: [infoEmbed("No active XP boost event.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    successEmbed(`⚡ **Active XP Boost Event**\nMultiplier: **${event.multiplier}x**\nExpires: <t:${Math.floor(new Date(event.expiresAt).getTime() / 1000)}:R>\nStarted by: <@${event.startedBy}>`),
                ],
            });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: start | stop | status")] });
        }
    },
};
export default command;
//# sourceMappingURL=xpboost.js.map