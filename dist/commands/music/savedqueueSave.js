import { successEmbed, errorEmbed } from "@/utils/embeds";
import { SavedQueueModel } from "@/database/models/Community";
const command = {
    name: "savedqueuesave",
    description: "Save the current queue for later use",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["savqueue", "qsave"],
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Name for this saved queue").setRequired(true).setMaxLength(50)),
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.getPlayer?.(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const tracks = player.queue?.tracks ?? [];
        const current = player.queue?.current;
        const allTracks = current ? [current, ...tracks] : tracks;
        if (allTracks.length === 0) {
            await ctx.reply({ embeds: [errorEmbed("No tracks in the queue to save.")] });
            return;
        }
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args.join(" ");
        if (!name) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a name for the saved queue.")] });
            return;
        }
        const serialized = allTracks.map((t) => ({
            title: t?.info?.title ?? t?.title ?? "Unknown",
            uri: t?.info?.uri ?? t?.uri ?? "",
            author: t?.info?.author ?? t?.author ?? "Unknown",
            duration: t?.info?.duration ?? t?.duration ?? 0,
        }));
        await SavedQueueModel.findOneAndUpdate({ guildId: guild.id, userId: ctx.userId, name }, { $set: { tracks: serialized } }, { upsert: true, new: true });
        await ctx.reply({ embeds: [successEmbed(`💾 Saved queue **"${name}"** with **${serialized.length}** track${serialized.length !== 1 ? "s" : ""}.`)] });
    },
};
export default command;
//# sourceMappingURL=savedqueueSave.js.map