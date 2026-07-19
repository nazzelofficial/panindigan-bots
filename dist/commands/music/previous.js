import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "previous",
    description: "Play the previous song",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["prev", "back"],
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
        if (!player?.playing && !player?.paused) {
            await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] });
            return;
        }
        const prev = player.queue?.previous ?? player.get?.("previousTrack");
        if (!prev) {
            await ctx.reply({ embeds: [errorEmbed("No previous track available.")] });
            return;
        }
        if (typeof player.skip === "function") {
            // Re-add current to front, seek to start of previous
            player.queue?.unshift?.(player.queue.current);
            player.queue?.unshift?.(prev);
            await player.skip();
        }
        else {
            await player.seek?.(0);
        }
        const title = prev.info?.title ?? prev.title ?? "previous track";
        await ctx.reply({ embeds: [successEmbed(`⏮️ Playing previous track: **${title}**`)] });
    },
};
export default command;
//# sourceMappingURL=previous.js.map