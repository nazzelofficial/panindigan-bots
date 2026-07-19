import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "starboard",
    description: "Configure the starboard — messages that get enough ⭐ reactions are pinned here",
    category: "Utility",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup").setDescription("Set up the starboard channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Starboard channel").setRequired(true))
        .addIntegerOption((o) => o.setName("threshold").setDescription("Minimum ⭐ reactions needed (default: 3)").setRequired(false).setMinValue(1).setMaxValue(50)))
        .addSubcommand((s) => s.setName("toggle").setDescription("Enable or disable the starboard")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("status").setDescription("View starboard configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "status");
        if (sub === "setup") {
            const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!channelId) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
                return;
            }
            const threshold = ctx.isSlash ? (ctx.interaction.options.getInteger("threshold") ?? 3) : (parseInt(ctx.args[2] ?? "3") || 3);
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "starboard.channelId": channelId, "starboard.threshold": threshold, "starboard.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Starboard configured!\n• Channel: <#${channelId}>\n• Threshold: **${threshold}** ⭐`)] });
        }
        else if (sub === "toggle") {
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "off";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "starboard.enabled": enabled } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Starboard **${enabled ? "enabled" : "disabled"}**.`)] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const sb = cfg?.starboard ?? {};
            const embed = baseEmbed("primary").setTitle("⭐ Starboard Configuration")
                .addFields({ name: "Status", value: sb.enabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Channel", value: sb.channelId ? `<#${sb.channelId}>` : "Not set", inline: true }, { name: "Threshold", value: sb.threshold ? `${sb.threshold} ⭐` : "3 ⭐ (default)", inline: true });
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=starboard.js.map