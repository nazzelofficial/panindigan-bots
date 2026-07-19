import { successEmbed, errorEmbed } from "@/utils/embeds";
import { SavedQueueModel } from "@/database/models/Community";
const command = {
    name: "savedqueuedelete",
    description: "Delete a saved queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["deletesavedqueue", "qdelete"],
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Name of the saved queue to delete").setRequired(true).setAutocomplete(true)),
    async autocomplete(interaction) {
        const focused = String(interaction.options.getFocused() ?? "").trim();
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        try {
            const filter = { guildId, userId };
            if (focused)
                filter["name"] = { $regex: focused, $options: "i" };
            const queues = await SavedQueueModel.find(filter).limit(25).lean();
            await interaction.respond(queues.map((q) => ({ name: String(q.name), value: String(q.name) })));
        }
        catch {
            await interaction.respond([]);
        }
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args.join(" ");
        if (!name) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the name of the saved queue to delete.")] });
            return;
        }
        const deleted = await SavedQueueModel.findOneAndDelete({ guildId: guild.id, userId: ctx.userId, name });
        if (!deleted) {
            await ctx.reply({ embeds: [errorEmbed(`No saved queue named **"${name}"** found.`)] });
            return;
        }
        await ctx.reply({ embeds: [successEmbed(`🗑️ Deleted saved queue **"${name}"**.`)] });
    },
};
export default command;
//# sourceMappingURL=savedqueueDelete.js.map