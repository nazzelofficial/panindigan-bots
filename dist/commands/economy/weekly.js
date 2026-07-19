import { UserModel } from "@/database/models/User";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const WEEKLY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const WEEKLY_BASE = 2_500;
const WEEKLY_STREAK_BONUS = 500; // per streak week, capped at 5
const command = {
    name: "weekly",
    description: "Claim your weekly reward (every 7 days)",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        const now = Date.now();
        const lastWeekly = profile.lastWeekly ?? null;
        if (lastWeekly && now - lastWeekly.getTime() < WEEKLY_COOLDOWN_MS) {
            const remaining = lastWeekly.getTime() + WEEKLY_COOLDOWN_MS - now;
            const days = Math.floor(remaining / 86_400_000);
            const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
            const mins = Math.floor((remaining % 3_600_000) / 60_000);
            await ctx.reply({
                embeds: [
                    errorEmbed(`Hindi mo pa matatanggap ang iyong weekly reward.\n\nSubukan ulit sa **${days}d ${hours}h ${mins}m**.`),
                ],
            });
            return;
        }
        // Update streak
        const lastDate = lastWeekly ? lastWeekly.getTime() : 0;
        const withinStreakWindow = now - lastDate < WEEKLY_COOLDOWN_MS * 2; // claimed within 2 weeks
        let streak = profile.weeklyStreak ?? 0;
        streak = withinStreakWindow && lastDate > 0 ? streak + 1 : 1;
        const streakBonus = Math.min(streak - 1, 5) * WEEKLY_STREAK_BONUS;
        const earned = WEEKLY_BASE + streakBonus;
        profile.balance = (profile.balance ?? 0) + earned;
        profile.lastWeekly = new Date();
        profile.weeklyStreak = streak;
        profile.totalEarned = (profile.totalEarned ?? 0) + earned;
        await user.save();
        const embed = baseEmbed("success")
            .setTitle("📅 Weekly Reward Claimed!")
            .addFields({ name: "Base Reward", value: `🪙 ${WEEKLY_BASE.toLocaleString()}`, inline: true }, { name: "Streak Bonus", value: streakBonus > 0 ? `🪙 +${streakBonus.toLocaleString()} (${streak}w streak)` : "None", inline: true }, { name: "Total Earned", value: `🪙 **+${earned.toLocaleString()}**`, inline: true }, { name: "New Balance", value: `🪙 **${(profile.balance).toLocaleString()}**`, inline: true }, { name: "Weekly Streak", value: `🔥 ${streak} week${streak !== 1 ? "s" : ""}`, inline: true }, { name: "Next Claim", value: `<t:${Math.floor((now + WEEKLY_COOLDOWN_MS) / 1000)}:R>`, inline: true })
            .setFooter({ text: streak >= 5 ? "🏆 Maximum streak bonus reached!" : `Claim ulit sa 7 araw para mapanatili ang streak!` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=weekly.js.map