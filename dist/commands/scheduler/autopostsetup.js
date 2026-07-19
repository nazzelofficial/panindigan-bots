import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "autopostsetup",
    description: "Set up auto-posting",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("interval").setDescription("Post interval (e.g., daily, hourly)").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Message to post").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to post to").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const interval = ctx.isSlash ? ctx.interaction.options.getString("interval", true) : ctx.args[0];
        const message = ctx.isSlash ? ctx.interaction.options.getString("message", true) : ctx.args[1];
        const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[2]?.replace(/\D/g, "") ?? "");
        if (!interval || !message || !channel) {
            await ctx.reply({ embeds: [errorEmbed("Please provide interval, message, and channel.")] });
            return;
        }
        if (!channel?.isTextBased?.()) {
            await ctx.reply({ embeds: [errorEmbed("Channel must be a text channel.")] });
            return;
        }
        const id = Date.now().toString();
        const autoPost = { id, interval, message, channelId: channel.id, enabled: true };
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { autoPosts: autoPost } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Auto-post set up (${interval}) in ${channel}. ID: ${id}`)] });
    },
};
export default command;
//# sourceMappingURL=autopostsetup.js.map