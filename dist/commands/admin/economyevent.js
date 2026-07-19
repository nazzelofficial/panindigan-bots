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
const EVENT_TYPES = ["doublecoins", "triplecoins", "doubleloot", "bonusdaily", "luckydrop"];
const command = {
    name: "economyevent",
    description: "Start or stop a temporary economy bonus event",
    category: "Admin",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["ecoevent", "economybonusevent"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("start")
        .setDescription("Start an economy bonus event")
        .addStringOption((o) => o.setName("type").setDescription("Event type").setRequired(true)
        .addChoices({ name: "Double Coins (all earnings ×2)", value: "doublecoins" }, { name: "Triple Coins (all earnings ×3)", value: "triplecoins" }, { name: "Double Loot (drops & fishing ×2)", value: "doubleloot" }, { name: "Bonus Daily (daily reward ×3)", value: "bonusdaily" }, { name: "Lucky Drop (random drops every 30min)", value: "luckydrop" }))
        .addStringOption((o) => o.setName("duration").setDescription("Duration (e.g. 2h, 1d)").setRequired(true)))
        .addSubcommand((s) => s.setName("stop").setDescription("Stop the currently active economy event"))
        .addSubcommand((s) => s.setName("status").setDescription("Check current economy event status")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const EVENT_LABELS = {
            doublecoins: "💰 Double Coins",
            triplecoins: "💰💰 Triple Coins",
            doubleloot: "🎣 Double Loot",
            bonusdaily: "📅 Bonus Daily",
            luckydrop: "🍀 Lucky Drop",
        };
        if (sub === "start") {
            const type = ctx.isSlash ? ctx.interaction.options.getString("type", true) : ctx.args[1] ?? "doublecoins";
            const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration", true) : ctx.args[2] ?? "1h";
            const ms = parseDuration(durationStr);
            if (!ms) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Use `1h`, `30m`, `2d`, etc.")] });
                return;
            }
            if (!EVENT_LABELS[type]) {
                await ctx.reply({ embeds: [errorEmbed(`Unknown event type. Valid: ${Object.keys(EVENT_LABELS).join(", ")}`)] });
                return;
            }
            const expiresAt = new Date(Date.now() + ms);
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
                $set: {
                    "economyEvent.active": true,
                    "economyEvent.type": type,
                    "economyEvent.expiresAt": expiresAt,
                    "economyEvent.startedBy": ctx.userId,
                },
            }, { upsert: true });
            await ctx.reply({
                embeds: [
                    successEmbed(`🎉 **${EVENT_LABELS[type]} Economy Event** started!\nActive until <t:${Math.floor(expiresAt.getTime() / 1000)}:F>.\n\nAll economy rewards affected by this event are boosted for all members!`),
                ],
            });
        }
        else if (sub === "stop") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            if (!doc?.economyEvent?.active) {
                await ctx.reply({ embeds: [infoEmbed("No active economy event.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "economyEvent.active": false } });
            await ctx.reply({ embeds: [successEmbed("Economy event stopped. Server is back to normal economy rates.")] });
        }
        else if (sub === "status") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const event = doc?.economyEvent;
            if (!event?.active || (event.expiresAt && new Date(event.expiresAt) < new Date())) {
                await ctx.reply({ embeds: [infoEmbed("No active economy event.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    successEmbed(`🎉 **Active Economy Event**\nType: **${EVENT_LABELS[event.type] ?? event.type}**\nExpires: <t:${Math.floor(new Date(event.expiresAt).getTime() / 1000)}:R>\nStarted by: <@${event.startedBy}>`),
                ],
            });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: start | stop | status")] });
        }
    },
};
export default command;
//# sourceMappingURL=economyevent.js.map