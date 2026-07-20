import { UserModel } from "../../database/models/User.js";
import { errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { config } from "../../config/config.js";
const DAILY_COOLDOWN_MS = 22 * 60 * 60 * 1000; // 22 hours
const command = {
    name: "daily",
    description: "Claim your daily coin reward",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["claim"],
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
        const lastDaily = profile.lastDaily;
        const now = Date.now();
        if (lastDaily && now - lastDaily.getTime() < DAILY_COOLDOWN_MS) {
            const remaining = lastDaily.getTime() + DAILY_COOLDOWN_MS - now;
            const h = Math.floor(remaining / 3_600_000);
            const m = Math.floor((remaining % 3_600_000) / 60_000);
            await ctx.reply({ embeds: [errorEmbed(`Daily already claimed. Come back in **${h}h ${m}m**.`)] });
            return;
        }
        // Streak logic
        const oneDayMs = 24 * 60 * 60 * 1000;
        let streak = profile.streak ?? 0;
        if (lastDaily && now - lastDaily.getTime() < oneDayMs * 2) {
            streak = Math.min(streak + 1, 30);
        }
        else {
            streak = 1;
        }
        profile.streak = streak;
        const baseAmount = config.economy?.dailyAmount ?? 500;
        const multiplier = config.economy?.dailyStreakMultiplier ?? 0.02;
        const bonus = Math.round(baseAmount * multiplier * (streak - 1));
        const totalAmount = baseAmount + bonus;
        const guildMultiplier = 1; // can be extended from guild config
        const reward = Math.round(totalAmount * guildMultiplier);
        profile.balance = (profile.balance ?? 0) + reward;
        profile.lastDaily = new Date();
        profile.totalEarned = (profile.totalEarned ?? 0) + reward;
        await user.save();
        const embed = baseEmbed("success")
            .setTitle("📅 Daily Reward Claimed!")
            .addFields({ name: "Reward", value: `🪙 **+${reward.toLocaleString()}**`, inline: true }, { name: "Streak", value: `🔥 **${streak} day${streak !== 1 ? "s" : ""}**`, inline: true }, { name: "Streak Bonus", value: bonus > 0 ? `🪙 +${bonus.toLocaleString()}` : "None", inline: true }, { name: "New Balance", value: `🪙 **${(profile.balance).toLocaleString()}**`, inline: true })
            .setFooter({ text: "Come back tomorrow to keep your streak!" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=daily.js.map