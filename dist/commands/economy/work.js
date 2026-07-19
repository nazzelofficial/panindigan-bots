import { UserModel } from "@/database/models/User";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
import { JOBS, getPayForJob } from "@/features/economy/jobs";
const WORK_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const WORK_MESSAGES = [
    "You worked hard and completed all your tasks.",
    "Your dedication to your job paid off today.",
    "A productive shift — your employer was impressed!",
    "You stayed late and finished the project ahead of schedule.",
    "You delivered excellent results at work today.",
    "Another solid performance at the office.",
    "Your coworkers praised your efforts today.",
    "The client loved your work — bonus incoming!",
];
const command = {
    name: "work",
    description: "Work your job to earn coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["job"],
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
        const lastWork = profile.lastWork;
        const now = Date.now();
        if (lastWork && now - lastWork.getTime() < WORK_COOLDOWN_MS) {
            const remaining = lastWork.getTime() + WORK_COOLDOWN_MS - now;
            const m = Math.floor(remaining / 60_000);
            const s = Math.floor((remaining % 60_000) / 1000);
            await ctx.reply({ embeds: [errorEmbed(`You already worked recently. Try again in **${m}m ${s}s**.`)] });
            return;
        }
        const jobId = profile.jobId;
        const job = jobId ? JOBS.find((j) => j.id === jobId) : null;
        const earned = job ? getPayForJob(job) : Math.floor(Math.random() * 251) + 150; // 150-400
        profile.balance = (profile.balance ?? 0) + earned;
        profile.lastWork = new Date();
        profile.totalEarned = (profile.totalEarned ?? 0) + earned;
        await user.save();
        const msg = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];
        const embed = baseEmbed("success")
            .setTitle(`💼 Work Complete${job ? ` — ${job.name}` : ""}`)
            .setDescription(msg)
            .addFields({ name: "Earned", value: `🪙 **+${earned.toLocaleString()}**`, inline: true }, { name: "Balance", value: `🪙 **${(profile.balance).toLocaleString()}**`, inline: true }, { name: "Next Work", value: "In 1 hour", inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=work.js.map