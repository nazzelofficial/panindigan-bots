import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "schedulerecurring",
    description: "Create a recurring scheduled task",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("name").setDescription("Task name").setRequired(true))
        .addStringOption((o) => o.setName("interval").setDescription("Interval (e.g., daily, weekly, hourly)").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Message to send").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to send to").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0];
        const interval = ctx.isSlash ? ctx.interaction.options.getString("interval", true) : ctx.args[1];
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args[2];
        const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[3]?.replace(/\D/g, "") ?? "");
        if (!name || !interval || !message || !channel) {
            await ctx.reply({ embeds: [errorEmbed("Please provide name, interval, message, and channel.")] });
            return;
        }
        if (!channel?.isTextBased?.()) {
            await ctx.reply({ embeds: [errorEmbed("Channel must be a text channel.")] });
            return;
        }
        const validIntervals = ["hourly", "daily", "weekly", "monthly"];
        if (!validIntervals.includes(interval.toLowerCase())) {
            await ctx.reply({ embeds: [errorEmbed(`Invalid interval. Use: ${validIntervals.join(", ")}`)] });
            return;
        }
        const task = { id: Date.now().toString(), name, interval: interval.toLowerCase(), message, channelId: channel.id, enabled: true };
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { recurringTasks: task } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Recurring task "${name}" created (${interval}) in ${channel}.`)] });
    },
};
export default command;
//# sourceMappingURL=schedulerecurring.js.map