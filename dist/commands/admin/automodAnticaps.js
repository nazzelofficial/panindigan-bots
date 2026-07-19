import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "anticaps",
    description: "Configure anti-caps protection — delete messages that exceed a caps percentage threshold",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["automodcaps", "capslockfilter"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("on").setDescription("Enable anti-caps protection"))
        .addSubcommand((s) => s.setName("off").setDescription("Disable anti-caps protection"))
        .addSubcommand((s) => s
        .setName("percent")
        .setDescription("Set the caps percentage that triggers the filter (default: 70%)")
        .addIntegerOption((o) => o
        .setName("percent")
        .setDescription("Percentage of uppercase characters (50–100)")
        .setRequired(true)
        .setMinValue(50)
        .setMaxValue(100)))
        .addSubcommand((s) => s.setName("status").setDescription("View current anti-caps configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "on" || sub === "off") {
            const enabled = sub === "on";
            // Store as a field — we repurpose antiFlood flag for caps in the schema.
            // Use a dedicated caps config sub-document if available, else store in automod flags.
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiCaps": enabled, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-caps protection **${enabled ? "enabled" : "disabled"}**.`)] });
            return;
        }
        if (sub === "percent") {
            const percent = ctx.isSlash
                ? ctx.interaction.options.getInteger("percent", true)
                : parseInt(ctx.args[1] ?? "70", 10);
            if (isNaN(percent) || percent < 50 || percent > 100) {
                await ctx.reply({ embeds: [errorEmbed("Percentage must be between 50 and 100.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.capsPercent": percent, "automod.antiCaps": true, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-caps threshold set to **${percent}%**. Messages with more than ${percent}% uppercase will be deleted.`)] });
            return;
        }
        if (sub === "status") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const am = cfg?.automod ?? {};
            const embed = baseEmbed("primary")
                .setTitle("🔡 Anti-Caps Status")
                .addFields({ name: "Status", value: am.antiCaps ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Caps threshold", value: `${am.capsPercent ?? 70}%`, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Use: on | off | percent | status")] });
    },
};
export default command;
//# sourceMappingURL=automodAnticaps.js.map