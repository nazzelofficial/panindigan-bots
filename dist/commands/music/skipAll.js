import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "skipall",
    description: "Skip all songs in the queue and stop playback",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["stopall"],
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
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const size = (player.queue?.tracks?.length ?? 0) + 1;
        const tracks = player.queue?.tracks ?? [];
        tracks.splice(0, tracks.length);
        if (typeof player.stop === "function")
            await player.stop();
        else if (typeof player.skip === "function")
            await player.skip();
        await ctx.reply({ embeds: [successEmbed(`⏹️ Skipped all **${size}** track${size !== 1 ? "s" : ""} and stopped playback.`)] });
    },
};
export default command;
//# sourceMappingURL=skipAll.js.map