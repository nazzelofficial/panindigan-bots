import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "antimentions",
    description: "Configure anti-mass-mention protection — limit how many pings a message can contain",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["automodmentions", "antimention"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("on")
        .setDescription("Enable anti-mass-mention protection"))
        .addSubcommand((s) => s
        .setName("off")
        .setDescription("Disable anti-mass-mention protection"))
        .addSubcommand((s) => s
        .setName("limit")
        .setDescription("Set the maximum allowed mentions per message")
        .addIntegerOption((o) => o
        .setName("count")
        .setDescription("Max mentions before action is taken (2–20)")
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(20)))
        .addSubcommand((s) => s.setName("status").setDescription("View current anti-mention configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "on") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const currentLimit = cfg?.automod?.antiMentionLimit ?? 0;
            const limit = currentLimit > 0 ? currentLimit : 5;
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiMentionLimit": limit, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-mention protection **enabled** — max **${limit}** mentions per message.`)] });
            return;
        }
        if (sub === "off") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiMentionLimit": 0 } });
            await ctx.reply({ embeds: [successEmbed("Anti-mention protection **disabled**.")] });
            return;
        }
        if (sub === "limit") {
            const count = ctx.isSlash
                ? ctx.interaction.options.getInteger("count", true)
                : parseInt(ctx.args[1] ?? "5", 10);
            if (isNaN(count) || count < 2 || count > 20) {
                await ctx.reply({ embeds: [errorEmbed("Limit must be between 2 and 20.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiMentionLimit": count, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-mention limit set to **${count}** mentions per message.`)] });
            return;
        }
        if (sub === "status") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const limit = cfg?.automod?.antiMentionLimit ?? 0;
            const embed = baseEmbed("primary")
                .setTitle("📣 Anti-Mention Status")
                .addFields({ name: "Status", value: limit > 0 ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Max mentions", value: limit > 0 ? `${limit} per message` : "N/A", inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Use: on | off | limit | status")] });
    },
};
export default command;
//# sourceMappingURL=automodAntimentions.js.map