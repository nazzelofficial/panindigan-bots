import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "scheduleinfo",
    description: "Get info about a scheduled task",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("id").setDescription("Task ID").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[0];
        if (!id) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a task ID.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const tasks = cfg?.scheduledTasks ?? [];
        const task = tasks.find((t) => t.id === id);
        if (!task) {
            await ctx.reply({ embeds: [errorEmbed("Task not found.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("📅 Task Info")
            .addFields({ name: "Name", value: task.name, inline: true }, { name: "Time", value: new Date(task.time).toLocaleString(), inline: true }, { name: "Status", value: task.executed ? "Executed" : "Pending", inline: true }, { name: "Channel", value: `<#${task.channelId}>`, inline: true }, { name: "Message", value: task.message, inline: false })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=scheduleinfo.js.map