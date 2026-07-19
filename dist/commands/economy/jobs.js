import { UserModel } from "../../database/models/User";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
import { JOBS } from "../../features/economy/jobs";
const command = {
    name: "jobs",
    description: "Browse available jobs, apply, or resign from your current job",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["job", "career"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("list").setDescription("View all available jobs"))
        .addSubcommand((s) => s
        .setName("info")
        .setDescription("View details of a specific job")
        .addStringOption((o) => o.setName("job").setDescription("Job ID").setRequired(true)
        .addChoices(...JOBS.map((j) => ({ name: j.name, value: j.id })))))
        .addSubcommand((s) => s
        .setName("apply")
        .setDescription("Apply for a job")
        .addStringOption((o) => o.setName("job").setDescription("Job ID").setRequired(true)
        .addChoices(...JOBS.map((j) => ({ name: j.name, value: j.id })))))
        .addSubcommand((s) => s.setName("resign").setDescription("Resign from your current job"))
        .addSubcommand((s) => s.setName("current").setDescription("View your current job")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "list");
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        const currentJobId = profile.jobId ?? null;
        if (sub === "list") {
            const embed = baseEmbed("primary")
                .setTitle("💼 Available Jobs")
                .setDescription(JOBS.map((j) => {
                const pay = `🪙 ${j.payMin}–${j.payMax}/hr`;
                const active = currentJobId === j.id ? " *(kasalukuyan)*" : "";
                return `**${j.name}** \`${j.id}\`${active}\n${pay} · Cooldown: ${j.cooldownHours}h`;
            }).join("\n\n"))
                .setFooter({ text: "Use /jobs apply [id] para mag-apply" });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (sub === "info") {
            const jobId = ctx.isSlash ? ctx.interaction.options.getString("job", true) : ctx.args[1];
            const job = JOBS.find((j) => j.id === jobId);
            if (!job) {
                await ctx.reply({ embeds: [errorEmbed(`No job found with ID \`${jobId}\`. Use \`/jobs list\`.`)] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle(`💼 ${job.name}`)
                .addFields({ name: "Job ID", value: `\`${job.id}\``, inline: true }, { name: "Pay Range", value: `🪙 ${job.payMin}–${job.payMax} per shift`, inline: true }, { name: "Cooldown", value: `${job.cooldownHours} hours`, inline: true })
                .setFooter({ text: currentJobId === job.id ? "✅ This is your current job." : "Use /jobs apply to apply." });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (sub === "apply") {
            const jobId = ctx.isSlash ? ctx.interaction.options.getString("job", true) : ctx.args[1];
            const job = JOBS.find((j) => j.id === jobId);
            if (!job) {
                await ctx.reply({ embeds: [errorEmbed(`No job found with ID \`${jobId}\`. Use \`/jobs list\`.`)] });
                return;
            }
            if (currentJobId === job.id) {
                await ctx.reply({ embeds: [infoEmbed(`Naka-apply ka na sa **${job.name}**.`)] });
                return;
            }
            profile.jobId = job.id;
            await user.save();
            await ctx.reply({ embeds: [successEmbed(`✅ You have applied to **${job.name}**!\n\nUse \`/work\` to earn **${job.payMin}–${job.payMax} coins** per shift (every ${job.cooldownHours}h).`)] });
            return;
        }
        if (sub === "resign") {
            if (!currentJobId) {
                await ctx.reply({ embeds: [infoEmbed("You do not have a current job.")] });
                return;
            }
            const jobName = JOBS.find((j) => j.id === currentJobId)?.name ?? currentJobId;
            profile.jobId = null;
            await user.save();
            await ctx.reply({ embeds: [successEmbed(`You have resigned from **${jobName}**. You can apply for a new job with \`/jobs apply\`.`)] });
            return;
        }
        if (sub === "current") {
            if (!currentJobId) {
                await ctx.reply({ embeds: [infoEmbed("You do not have a current job. Use `/jobs apply` para mag-apply.")] });
                return;
            }
            const job = JOBS.find((j) => j.id === currentJobId);
            if (!job) {
                await ctx.reply({ embeds: [infoEmbed("Invalid job ID on your profile. Use `/jobs resign` and apply again.")] });
                return;
            }
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle(`💼 Inyong Currently Trabaho`)
                        .addFields({ name: "Job", value: job.name, inline: true }, { name: "Pay", value: `🪙 ${job.payMin}–${job.payMax}/shift`, inline: true }, { name: "Cooldown", value: `${job.cooldownHours}h`, inline: true }),
                ],
            });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: list | info | apply | resign | current")] });
    },
};
export default command;
//# sourceMappingURL=jobs.js.map