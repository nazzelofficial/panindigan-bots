import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "scheduledelete",
    description: "Delete a scheduled task",
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
        const index = tasks.findIndex((t) => t.id === id);
        if (index === -1) {
            await ctx.reply({ embeds: [errorEmbed("Task not found.")] });
            return;
        }
        tasks.splice(index, 1);
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { scheduledTasks: tasks } });
        await ctx.reply({ embeds: [successEmbed("Scheduled task deleted.")] });
    },
};
export default command;
//# sourceMappingURL=scheduledelete.js.map