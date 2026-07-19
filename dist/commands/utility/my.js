import { UserModel } from "../../database/models/User";
import { ModCaseModel } from "../../database/models/Moderation";
import { baseEmbed } from "../../utils/embeds";
import { JOBS } from "../../features/economy/jobs";
const command = {
    name: "my",
    description: "View inyong personal na stats: level, balance, warnings, reminders, atbp.",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["mystats", "me"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("level").setDescription("View inyong leveling stats"))
        .addSubcommand((s) => s.setName("balance").setDescription("View inyong economy stats"))
        .addSubcommand((s) => s.setName("warnings").setDescription("View inyong warnings"))
        .addSubcommand((s) => s.setName("reminders").setDescription("View inyong active reminders"))
        .addSubcommand((s) => s.setName("stats").setDescription("View inyong full stats overview")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "stats");
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        const profile = user.guilds.find((g) => g.guildId === guild.id) ?? {};
        const member = await guild.members.fetch(ctx.userId).catch(() => null);
        const displayName = member?.displayName ?? "You";
        if (sub === "level") {
            const xp = profile.xp ?? 0;
            const level = profile.level ?? 0;
            const nextXp = (level + 1) * 100;
            const barFilled = Math.min(10, Math.round((xp / nextXp) * 10));
            const bar = "▓".repeat(barFilled) + "░".repeat(10 - barFilled);
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`⭐ Leveling Stats — ${displayName}`)
                        .addFields({ name: "Level", value: `**${level}**`, inline: true }, { name: "XP", value: `**${xp}** / ${nextXp}`, inline: true }, { name: "Progress", value: bar, inline: false }, { name: "Total XP", value: String(profile.totalXp ?? xp), inline: true }, { name: "Prestige", value: String(profile.prestige ?? 0), inline: true }, { name: "Messages", value: String(profile.messageCount ?? 0), inline: true }),
                ],
            });
            return;
        }
        if (sub === "balance") {
            const balance = profile.balance ?? 0;
            const bank = profile.bank ?? 0;
            const jobId = profile.jobId ?? null;
            const job = jobId ? JOBS.find((j) => j.id === jobId) : null;
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`💰 Economy Stats — ${displayName}`)
                        .addFields({ name: "Wallet", value: `🪙 **${balance.toLocaleString()}**`, inline: true }, { name: "Bank", value: `🏦 **${bank.toLocaleString()}**`, inline: true }, { name: "Net Worth", value: `💎 **${(balance + bank).toLocaleString()}**`, inline: true }, { name: "Job", value: job ? job.name : "Unemployed", inline: true }, { name: "Total Earned", value: `🪙 ${(profile.totalEarned ?? 0).toLocaleString()}`, inline: true }, { name: "Daily Streak", value: `🔥 ${profile.dailyStreak ?? 0} days`, inline: true }),
                ],
            });
            return;
        }
        if (sub === "warnings") {
            const cases = await ModCaseModel.find({ guildId: guild.id, userId: ctx.userId, type: "warn", active: { $ne: false } })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            if (!cases.length) {
                await ctx.reply({ embeds: [baseEmbed("success").setTitle("✅ No Warnings").setDescription("No active warnings!")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("warning")
                        .setTitle(`⚠️ Your Warnings — ${displayName}`)
                        .setDescription(cases.map((c, i) => `${i + 1}. Case #${c.caseId} — ${c.reason ?? "No reason"}\n   <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`).join("\n\n"))
                        .setFooter({ text: `${cases.length} active warning${cases.length !== 1 ? "s" : ""}` }),
                ],
            });
            return;
        }
        if (sub === "reminders") {
            const reminders = profile.reminders ?? [];
            const active = reminders.filter((r) => new Date(r.remindAt) > new Date());
            if (!active.length) {
                await ctx.reply({ embeds: [baseEmbed("primary").setTitle("⏰ Your Reminders").setDescription("No active reminders.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`⏰ Your Reminders (${active.length})`)
                        .setDescription(active.map((r, i) => `${i + 1}. **${r.text?.slice(0, 80) ?? "Reminder"}**\n   Due: <t:${Math.floor(new Date(r.remindAt).getTime() / 1000)}:R>`).join("\n\n")),
                ],
            });
            return;
        }
        // stats — full overview
        const xp = profile.xp ?? 0;
        const level = profile.level ?? 0;
        const balance = profile.balance ?? 0;
        const bank = profile.bank ?? 0;
        const warnCount = await ModCaseModel.countDocuments({ guildId: guild.id, userId: ctx.userId, type: "warn", active: { $ne: false } });
        await ctx.reply({
            embeds: [
                baseEmbed("primary")
                    .setTitle(`📊 My Stats — ${displayName}`)
                    .setThumbnail(member?.displayAvatarURL() ?? null)
                    .addFields({ name: "⭐ Level", value: String(level), inline: true }, { name: "✨ XP", value: xp.toLocaleString(), inline: true }, { name: "🏅 Prestige", value: String(profile.prestige ?? 0), inline: true }, { name: "🪙 Wallet", value: balance.toLocaleString(), inline: true }, { name: "🏦 Bank", value: bank.toLocaleString(), inline: true }, { name: "⚠️ Warnings", value: String(warnCount), inline: true }, { name: "💼 Job", value: profile.jobId ? (JOBS.find((j) => j.id === profile.jobId)?.name ?? profile.jobId) : "Unemployed", inline: true }, { name: "💬 Messages", value: String(profile.messageCount ?? 0), inline: true }, { name: "🔥 Daily Streak", value: String(profile.dailyStreak ?? 0), inline: true }),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=my.js.map