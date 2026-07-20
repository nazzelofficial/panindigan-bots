import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
const command = {
    name: "musicunmute",
    description: "Unmute the music player (restores previous volume). Pair with musicmute.",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["musicunmute", "volumeunmute", "munmute"],
    slashData: (b) => b,
    async execute(ctx) {
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [errorEmbed(validationError)] });
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
        const restore = player.get?.("premuteVolume") ?? 80;
        await player.setVolume?.(restore);
        player.set?.("premuteVolume", null);
        await ctx.reply({ embeds: [errorEmbed(`🔊 Music unmuted. Volume restored to **${restore}%**.`)] });
    },
};
export default command;
//# sourceMappingURL=volumeUnmute.js.map