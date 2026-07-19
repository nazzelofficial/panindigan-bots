import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "replay",
    description: "Replay the current song from the beginning",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["restart", "replaycurrent"],
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
        await player.seek?.(0);
        const title = player.queue?.current?.info?.title ?? player.queue?.current?.title ?? "current track";
        await ctx.reply({ embeds: [successEmbed(`🔁 Replaying **${title}** from the beginning.`)] });
    },
};
export default command;
//# sourceMappingURL=replay.js.map