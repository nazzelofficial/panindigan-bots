import { AttachmentBuilder, PermissionFlagsBits } from "discord.js";
import { ModCaseModel } from "@/database/models/Moderation";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "logsexport",
    description: "Export moderation logs as a downloadable JSON or CSV file",
    category: "Logging",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.Administrator],
    guildOnly: true,
    cooldown: 60,
    aliases: ["exportlogs", "modlogsexport"],
    slashData: (b) => b
        .addStringOption((o) => o
        .setName("format")
        .setDescription("Export format")
        .setRequired(false)
        .addChoices({ name: "JSON", value: "json" }, { name: "CSV", value: "csv" }))
        .addUserOption((o) => o.setName("user").setDescription("Filter logs by user (optional)").setRequired(false))
        .addIntegerOption((o) => o
        .setName("limit")
        .setDescription("Max entries to export (default: 500)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1000)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const format = ctx.isSlash ? ctx.interaction.options.getString("format") ?? "json" : ctx.args[0] ?? "json";
        const userId = ctx.isSlash ? ctx.interaction.options.getUser("user")?.id ?? null : null;
        const limit = ctx.isSlash ? ctx.interaction.options.getInteger("limit") ?? 500 : 500;
        const filter = { guildId: guild.id };
        if (userId)
            filter.userId = userId;
        await ctx.reply({ embeds: [baseEmbed("info").setDescription("⏳ Generating export file…")] });
        const cases = await ModCaseModel.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        if (!cases.length) {
            await ctx.reply({ embeds: [errorEmbed("No moderation cases found matching your filters.")] });
            return;
        }
        let content;
        let filename;
        if (format === "csv") {
            const headers = "caseId,type,userId,moderatorId,reason,duration,createdAt,active";
            const rows = cases.map((c) => [
                c.caseId,
                c.type,
                c.userId,
                c.moderatorId,
                `"${(c.reason ?? "").replace(/"/g, '""')}"`,
                c.duration ?? "",
                new Date(c.createdAt).toISOString(),
                c.active,
            ].join(","));
            content = [headers, ...rows].join("\n");
            filename = `modlogs-${guild.id}-${Date.now()}.csv`;
        }
        else {
            content = JSON.stringify(cases.map((c) => ({
                caseId: c.caseId,
                type: c.type,
                userId: c.userId,
                moderatorId: c.moderatorId,
                reason: c.reason,
                duration: c.duration,
                active: c.active,
                createdAt: c.createdAt,
            })), null, 2);
            filename = `modlogs-${guild.id}-${Date.now()}.json`;
        }
        const buffer = Buffer.from(content, "utf-8");
        const attachment = new AttachmentBuilder(buffer, { name: filename });
        const embed = baseEmbed("success")
            .setTitle("📤 Moderation Logs Export")
            .addFields({ name: "Format", value: format.toUpperCase(), inline: true }, { name: "Entries", value: cases.length.toString(), inline: true }, { name: "Server", value: guild.name, inline: true })
            .setFooter({ text: "File attached below" });
        await ctx.reply({ embeds: [embed], files: [attachment] });
    },
};
export default command;
//# sourceMappingURL=logsExport.js.map