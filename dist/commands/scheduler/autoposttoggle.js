import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "autoposttoggle",
    description: "Toggle auto-post on/off",
    category: "Scheduler",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addStringOption((o) => o.setName("id").setDescription("Auto-post ID").setRequired(true))
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[0];
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1] === "true";
        if (!id) {
            await ctx.reply({ embeds: [errorEmbed("Please provide an auto-post ID.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const autoPosts = cfg?.autoPosts ?? [];
        const index = autoPosts.findIndex((p) => p.id === id);
        if (index === -1) {
            await ctx.reply({ embeds: [errorEmbed("Auto-post not found.")] });
            return;
        }
        autoPosts[index].enabled = enabled;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { autoPosts } });
        await ctx.reply({ embeds: [successEmbed(`Auto-post ${enabled ? "enabled" : "disabled"}.`)] });
    },
};
export default command;
//# sourceMappingURL=autoposttoggle.js.map