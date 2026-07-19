import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, baseEmbed } from "@/utils/embeds";
import { sendLogEvent } from "@/features/logging/logEngine";
const command = {
    name: "raidmode",
    description: "Enable or disable raid mode — when on, new joins are restricted and alerted",
    category: "Moderation",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["antiraid"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("on").setDescription("Enable raid mode")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for enabling (optional)").setRequired(false)))
        .addSubcommand((s) => s.setName("off").setDescription("Disable raid mode"))
        .addSubcommand((s) => s.setName("status").setDescription("Check current raid mode status")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "status");
        if (sub === "on") {
            const reason = ctx.isSlash ? (ctx.interaction.options.getString("reason") ?? "Raid mode enabled") : ctx.args.slice(1).join(" ") || "Raid mode enabled";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "raidMode.enabled": true, "raidMode.reason": reason, "raidMode.enabledAt": new Date(), "raidMode.enabledBy": ctx.userId } }, { upsert: true });
            await sendLogEvent(guild.id, "raidMode", () => new EmbedBuilder().setTitle("🚨 Raid Mode Enabled").addFields({ name: "Reason", value: reason }).setTimestamp()).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`🚨 **Raid Mode ENABLED**\nReason: ${reason}\n\nNew members will face heightened restrictions. Use \`raidmode off\` when the situation is resolved.`)] });
        }
        else if (sub === "off") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "raidMode.enabled": false } });
            await sendLogEvent(guild.id, "raidMode", () => new EmbedBuilder().setTitle("✅ Raid Mode Disabled").setTimestamp()).catch(() => { });
            await ctx.reply({ embeds: [successEmbed("✅ **Raid Mode DISABLED**\nServer is back to normal operation.")] });
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const rm = cfg?.raidMode ?? {};
            const embed = baseEmbed(rm.enabled ? "danger" : "primary")
                .setTitle("🛡️ Raid Mode Status")
                .addFields({ name: "Status", value: rm.enabled ? "🚨 **ACTIVE**" : "✅ Inactive", inline: true }, { name: "Reason", value: rm.reason ?? "N/A", inline: true }, { name: "Enabled At", value: rm.enabledAt ? `<t:${Math.floor(new Date(rm.enabledAt).getTime() / 1000)}:R>` : "N/A", inline: true });
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=raidmode.js.map