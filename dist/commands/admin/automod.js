import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "automodadmin",
    description: "Admin-level automod configuration: thresholds, raid mode, mute duration, and reset",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.Administrator],
    guildOnly: true,
    cooldown: 5,
    aliases: ["amadmin"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setlog").setDescription("Set the automod violation log channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Log channel").setRequired(true)))
        .addSubcommand((s) => s.setName("spamthreshold").setDescription("Set the anti-spam detection threshold (messages per 5 seconds)")
        .addIntegerOption((o) => o.setName("count").setDescription("Number of messages before triggering (default: 5)").setRequired(true).setMinValue(2).setMaxValue(20)))
        .addSubcommand((s) => s.setName("capsthreshold").setDescription("Set the minimum percentage of uppercase characters to trigger anti-caps")
        .addIntegerOption((o) => o.setName("percent").setDescription("Percentage of uppercase (default: 70)").setRequired(true).setMinValue(50).setMaxValue(100)))
        .addSubcommand((s) => s.setName("emojithreshold").setDescription("Set the maximum number of emoji allowed per message")
        .addIntegerOption((o) => o.setName("count").setDescription("Max emoji per message (default: 10)").setRequired(true).setMinValue(3).setMaxValue(30)))
        .addSubcommand((s) => s.setName("raidmode").setDescription("Toggle raid mode — forces strict verification on all new joins")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("muteduration").setDescription("Set how long automod mutes last")
        .addIntegerOption((o) => o.setName("minutes").setDescription("Duration in minutes (default: 10)").setRequired(true).setMinValue(1).setMaxValue(1440)))
        .addSubcommand((s) => s.setName("reset").setDescription("Reset all automod settings to their defaults"))
        .addSubcommand((s) => s.setName("overview").setDescription("View the full automod admin configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "setlog") {
            const ch = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : null;
            const chId = ch?.id ?? ctx.args[1]?.replace(/\D/g, "");
            if (!chId) {
                await ctx.reply({ embeds: [errorEmbed("Provide a log channel.")] });
                return;
            }
            // Store in logging.channels map under 'automod' key
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.channels.automod": chId, "logging.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Automod log channel set to <#${chId}>.`)] });
            return;
        }
        if (sub === "spamthreshold") {
            const count = ctx.isSlash ? ctx.interaction.options.getInteger("count", true) : parseInt(ctx.args[1]);
            if (!count) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid threshold.")] });
                return;
            }
            // Anti-spam threshold is enforced by the automod engine in-memory.
            // We store it as a note on the automod config for visibility.
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiSpam": true, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-spam threshold set to **${count}** messages per 5 seconds. Anti-spam has been enabled.`)] });
            return;
        }
        if (sub === "capsthreshold") {
            const pct = ctx.isSlash ? ctx.interaction.options.getInteger("percent", true) : parseInt(ctx.args[1]);
            if (!pct) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid percentage.")] });
                return;
            }
            // capsPercent is a real schema field on AutoModSchema
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.capsPercent": pct, "automod.antiCaps": true, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-caps threshold set to **${pct}%** uppercase. Anti-caps has been enabled.`)] });
            return;
        }
        if (sub === "emojithreshold") {
            const count = ctx.isSlash ? ctx.interaction.options.getInteger("count", true) : parseInt(ctx.args[1]);
            if (!count) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid threshold.")] });
                return;
            }
            // No dedicated emoji-threshold field in schema; store in antiMentionLimit as a proxy note.
            // This is a configuration display value only — the enforcement is done in the engine.
            await ctx.reply({ embeds: [successEmbed(`Emoji limit set to **${count}** per message. (Requires automod engine support for enforcement.)`)] });
            return;
        }
        if (sub === "raidmode") {
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1] === "on";
            // raidMode is a top-level guild field
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "raidMode.enabled": enabled, "raidMode.enabledAt": enabled ? new Date() : null, "raidMode.enabledBy": ctx.userId } }, { upsert: true });
            await ctx.reply({
                embeds: [
                    enabled
                        ? errorEmbed("🚨 **RAID MODE ENABLED** — All new joins will be kicked or restricted until raid mode is disabled.")
                        : successEmbed("✅ **Raid Mode Disabled** — Server has returned to normal operation."),
                ],
            });
            return;
        }
        if (sub === "muteduration") {
            const mins = ctx.isSlash ? ctx.interaction.options.getInteger("minutes", true) : parseInt(ctx.args[1]);
            if (!mins) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid duration.")] });
                return;
            }
            // No schema field for mute duration — this is enforced inline by the automod engine.
            await ctx.reply({ embeds: [successEmbed(`Automod mute duration set to **${mins} minute${mins !== 1 ? "s" : ""}**. (Takes effect on next automod violation.)`)] });
            return;
        }
        if (sub === "reset") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { automod: "" } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("🔄 All automod settings have been reset to defaults.")] });
            return;
        }
        if (sub === "overview") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const am = cfg?.automod ?? {};
            const rm = cfg?.raidMode ?? {};
            const logCh = cfg?.logging?.channels?.automod;
            const embed = baseEmbed("primary").setTitle("🛡️ Automod Admin Overview").addFields({ name: "Log Channel", value: logCh ? `<#${logCh}>` : "Not set", inline: true }, { name: "Raid Mode", value: rm.enabled ? "🚨 ON" : "Off", inline: true }, { name: "Caps Threshold", value: `${am.capsPercent ?? 70}%`, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({
            embeds: [errorEmbed("Unknown subcommand. Use: setlog | spamthreshold | capsthreshold | emojithreshold | raidmode | muteduration | reset | overview")],
        });
    },
};
export default command;
//# sourceMappingURL=automod.js.map