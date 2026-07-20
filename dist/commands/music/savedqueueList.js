import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { SavedQueueModel } from "../../database/models/Community.js";
const command = {
    name: "savedqueuelist",
    description: "List all your saved queues",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["listqueues", "qlist"],
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const queues = await SavedQueueModel.find({ guildId: guild.id, userId: ctx.userId }).lean().limit(20);
        if (queues.length === 0) {
            await ctx.reply({ embeds: [errorEmbed("You have no saved queues. Use `/savedqueuesave` to save the current queue.")] });
            return;
        }
        const lines = queues.map((q, i) => `**${i + 1}.** \`${q.name}\` — ${q.tracks.length} track${q.tracks.length !== 1 ? "s" : ""}`);
        const embed = baseEmbed("primary")
            .setTitle("💾 Your Saved Queues")
            .setDescription(lines.join("\n"))
            .setFooter({ text: `${queues.length} saved queue${queues.length !== 1 ? "s" : ""} • Use /savedqueueload <name> to load one` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=savedqueueList.js.map