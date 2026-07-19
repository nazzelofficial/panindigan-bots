import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "clear",
    description: "Clear the music queue (keeps current song playing)",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["clearqueue", "qclear"],
    slashData: (b) => b,
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
            await ctx.reply({ embeds: [errorEmbed("No active music queue.")] });
            return;
        }
        const queueSize = player.queue?.tracks?.length ?? 0;
        if (queueSize === 0) {
            await ctx.reply({ embeds: [errorEmbed("The queue is already empty.")] });
            return;
        }
        if (typeof player.queue?.splice === "function")
            player.queue.splice(0, queueSize);
        else if (typeof player.queue?.tracks?.splice === "function")
            player.queue.tracks.splice(0, queueSize);
        await ctx.reply({ embeds: [successEmbed(`🗑️ Cleared **${queueSize}** track${queueSize !== 1 ? "s" : ""} from the queue.`)] });
    },
};
export default command;
//# sourceMappingURL=clear.js.map