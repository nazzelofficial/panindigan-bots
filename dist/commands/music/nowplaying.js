import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
import { createNowPlayingEmbed, createMusicButtonRow } from "../../features/music/embeds/musicEmbeds.js";
const command = {
    name: "nowplaying",
    description: "Show the currently playing track",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["np", "current"],
    async execute(ctx) {
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [errorEmbed(validationError)] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.players?.get(guild.id);
        const result = MusicService.getNowPlaying(player);
        if (!result.success) {
            await ctx.reply({ embeds: [errorEmbed(result.message || "Nothing is currently playing.")] });
            return;
        }
        const embed = createNowPlayingEmbed(player.queue, result.track, result.position || 0);
        const buttons = createMusicButtonRow(player.paused, "off", false);
        await ctx.reply({ embeds: [embed], components: [buttons] });
    },
};
export default command;
//# sourceMappingURL=nowplaying.js.map