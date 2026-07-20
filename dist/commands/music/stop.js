import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
const command = {
    name: "stop",
    description: "Ihinto ang music at i-clear ang queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
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
        const lava = ctx.client.lavalink;
        if (!lava) {
            await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] });
            return;
        }
        const player = lava.getPlayer?.(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const result = await MusicService.stop(player);
        await ctx.reply({ embeds: [result.success ? errorEmbed("⏹️ Naitigil ang music at na-clear ang queue.") : errorEmbed(result.message)] });
    },
};
export default command;
//# sourceMappingURL=stop.js.map