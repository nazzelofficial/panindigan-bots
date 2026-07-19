import { ModCaseModel } from "@/database/models/Moderation";
import { baseEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "warnlist",
    description: "List all members who have active warnings in this server",
    category: "Moderation",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["warned", "allwarnings"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const page = ctx.isSlash ? (ctx.interaction.options.getInteger("page") ?? 1) : (parseInt(ctx.args[0]) || 1);
        const pageSize = 10;
        const skip = (page - 1) * pageSize;
        // Get all active warnings grouped by user
        const warnings = await ModCaseModel.find({ guildId: guild.id, type: "warn", active: true }).lean().sort({ createdAt: -1 });
        if (!warnings.length) {
            await ctx.reply({ embeds: [infoEmbed("No active warnings in this server.")] });
            return;
        }
        // Group by userId
        const grouped = new Map();
        for (const w of warnings) {
            grouped.set(w.userId, (grouped.get(w.userId) ?? 0) + 1);
        }
        const entries = [...grouped.entries()].sort((a, b) => b[1] - a[1]);
        const total = entries.length;
        const totalPages = Math.ceil(total / pageSize);
        const page_entries = entries.slice(skip, skip + pageSize);
        if (!page_entries.length) {
            await ctx.reply({ embeds: [errorEmbed(`Page ${page} doesn't exist. There are only ${totalPages} page(s).`)] });
            return;
        }
        const embed = baseEmbed("warning")
            .setTitle("⚠️ Warned Members")
            .setDescription(page_entries.map(([userId, count], i) => {
            const member = guild.members.cache.get(userId);
            const display = member ? `${member.user.username} (<@${userId}>)` : `<@${userId}>`;
            return `**${skip + i + 1}.** ${display} — **${count}** warning${count !== 1 ? "s" : ""}`;
        }).join("\n"))
            .setFooter({ text: `Page ${page}/${totalPages} · ${total} member${total !== 1 ? "s" : ""} with warnings` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=warnlist.js.map